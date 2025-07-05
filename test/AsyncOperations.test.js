const cds = require('@sap/cds')
const { GET, expect } = cds.test.in(__dirname + '/app')

describe('AsyncOperations', () => {

    const cachingOptions = {
        impl: "cds-caching"
    }
    let cache;

    // berfore connect to the cache service
    beforeEach(async () => {
        cache = await cds.connect.to(cachingOptions);
        await cache.clear();
    })

    describe('rt.wrap', () => {

        it("should wrap an async function", async () => {
            const expensiveOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return ["expensive", "result"];
            }
            const cachedExpensiveOperation = cache.rt.wrap("key", expensiveOperation);
            const { result, cacheKey } = await cachedExpensiveOperation();
            expect(result).to.eql(["expensive", "result"]);
            const cachedValue = await cache.get(cacheKey);
            expect(result).to.eql(cachedValue?.value || cachedValue);
            expect(cacheKey).to.match(/^key:/);
        })

        it("should return the result from the cache if the function is called again", async () => {
            const expensiveOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return ["expensive", "result"];
            }
            const cachedExpensiveOperation = cache.rt.wrap("key", expensiveOperation);
            const { result: result1, cacheKey: cacheKey1 } = await cachedExpensiveOperation();
            expect(result1).to.eql(["expensive", "result"]);
            const cachedValue1 = await cache.get(cacheKey1);
            expect(result1).to.eql(cachedValue1?.value || cachedValue1);
            expect(cacheKey1).to.match(/^key:/);

            // Force manipulation of the cache
            await cache.set(cacheKey1, ["expensive", "result2"]);

            const { result: result2, cacheKey: cacheKey2 } = await cachedExpensiveOperation();
            expect(result2).to.eql(["expensive", "result2"]);
            const cachedValue2 = await cache.get(cacheKey2);
            expect(result2).to.eql(cachedValue2?.value || cachedValue2);
            expect(cacheKey2).to.match(/^key:/);
        })

        it("should wrap an async function with args", async () => {
            const expensiveOperation = async (value) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return value;
            }
            const cachedExpensiveOperation = cache.rt.wrap("key", expensiveOperation);
            const { result, cacheKey } = await cachedExpensiveOperation("value");
            expect(result).to.eql("value");
            const cachedValue = await cache.get(cacheKey);
            expect(result).to.eql(cachedValue?.value || cachedValue);
        })

        it("should wrap an async function with ttl", async () => {
            const expensiveOperation = async (value) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return value;
            }
            const cachedExpensiveOperation = cache.rt.wrap("key", expensiveOperation, { ttl: 1000 });
            const { cacheKey } = await cachedExpensiveOperation("value");

            await new Promise(resolve => setTimeout(resolve, 2000));
            const value2 = await cache.get(cacheKey);
            expect(value2?.value || value2).to.be.undefined;
        })

        it("should return cached result on subsequent calls", async () => {
            let executionCount = 0;
            const expensiveOperation = async () => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return ["expensive", "result", executionCount];
            }
            
            const cachedExpensiveOperation = cache.rt.wrap("key", expensiveOperation);
            
            // First call - should execute the function
            const { result: result1, cacheKey: cacheKey1 } = await cachedExpensiveOperation();
            expect(result1).to.eql(["expensive", "result", 1]);
            const cachedValue1 = await cache.get(cacheKey1);
            expect(result1).to.eql(cachedValue1?.value || cachedValue1);
            expect(executionCount).to.eql(1);

            // Second call - should return cached result
            const { result: result2, cacheKey: cacheKey2 } = await cachedExpensiveOperation();
            expect(result2).to.eql(["expensive", "result", 1]); // Same as first result
            expect(executionCount).to.eql(1); // Function should not be called again
        })

        it("should handle different keys independently", async () => {
            const expensiveOperation = async (value) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return `result_${value}`;
            }
            
            const cachedOperation1 = cache.rt.wrap("key1", expensiveOperation);
            const cachedOperation2 = cache.rt.wrap("key2", expensiveOperation);
            
            const { result: result1, cacheKey: cacheKey1 } = await cachedOperation1("A");
            const { result: result2, cacheKey: cacheKey2 } = await cachedOperation2("B");
            
            expect(result1).to.eql("result_A");
            expect(result2).to.eql("result_B");
            const cachedValue1 = await cache.get(cacheKey1);
            const cachedValue2 = await cache.get(cacheKey2);
            expect(cachedValue1?.value || cachedValue1).to.eql("result_A");
            expect(cachedValue2?.value || cachedValue2).to.eql("result_B");
        })

        it("should handle function errors gracefully", async () => {
            const failingOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                throw new Error("Function failed");
            }
            
            const cachedFailingOperation = cache.rt.wrap("key", failingOperation);
            try {
                await cachedFailingOperation();
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(error.message).to.eql("Function failed");
                // Should not cache failed operations
                const cachedValue = await cache.get("key");
                expect(cachedValue?.value || cachedValue).to.be.undefined;
            }
        })

        it("should handle complex return values", async () => {
            const complexOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return {
                    data: ["item1", "item2"],
                    metadata: {
                        count: 2,
                        timestamp: Date.now()
                    },
                    nested: {
                        deep: {
                            value: "test"
                        }
                    }
                };
            }
            
            const cachedComplexOperation = cache.rt.wrap("key", complexOperation);
            const { result, cacheKey  } = await cachedComplexOperation();
            
            expect(result).to.have.property('data').that.eql(["item1", "item2"]);
            expect(result).to.have.property('metadata').that.has.property('count', 2);
            expect(result).to.have.property('nested').that.has.property('deep').that.has.property('value', 'test');
            const cachedValue = await cache.get(cacheKey);
            expect(result).to.eql(cachedValue?.value || cachedValue);
        })

        it("should work with tags", async () => {
            const expensiveOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return "tagged_value";
            }
            
            const cachedExpensiveOperation = cache.rt.wrap("key", expensiveOperation, { tags: ["tag1", "tag2"] });
            const { result, cacheKey } = await cachedExpensiveOperation();
            expect(result).to.eql("tagged_value");
            
            // Verify tags are stored
            const metadata = await cache.metadata(cacheKey);
            expect(metadata.tags).to.include("tag1");
            expect(metadata.tags).to.include("tag2");
        })

        it("should handle null and undefined return values", async () => {
            const nullOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return null;
            }
            
            const undefinedOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return undefined;
            }
            
            const cachedNullOperation = cache.rt.wrap("null_key", nullOperation);
            const cachedUndefinedOperation = cache.rt.wrap("undefined_key", undefinedOperation);
            
            const { result: nullResult, cacheKey: cacheKeyNull } = await cachedNullOperation();
            const { result: undefinedResult, cacheKey: cacheKeyUndefined } = await cachedUndefinedOperation();
            
            expect(nullResult).to.be.null;
            expect(undefinedResult).to.be.undefined;
            const cachedNullValue = await cache.get(cacheKeyNull);
            const cachedUndefinedValue = await cache.get(cacheKeyUndefined);
            expect(cachedNullValue?.value || cachedNullValue).to.be.null;
            expect(cachedUndefinedValue?.value || cachedUndefinedValue).to.be.undefined;
        })

        it("should handle boolean return values", async () => {
            const trueOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return true;
            }
            
            const falseOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return false;
            }
            
            const cachedTrueOperation = cache.rt.wrap("true_key", trueOperation);
            const cachedFalseOperation = cache.rt.wrap("false_key", falseOperation);
            
            const { result: trueResult, cacheKey: cacheKeyTrue } = await cachedTrueOperation();
            const { result: falseResult, cacheKey: cacheKeyFalse } = await cachedFalseOperation();
            
            expect(trueResult).to.be.true;
            expect(falseResult).to.be.false;
            const cachedTrueValue = await cache.get(cacheKeyTrue);
            const cachedFalseValue = await cache.get(cacheKeyFalse);
            expect(cachedTrueValue?.value || cachedTrueValue).to.be.true;
            expect(cachedFalseValue?.value || cachedFalseValue).to.be.false;
        })

        it("should handle numeric return values", async () => {
            const numberOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return 42;
            }
            
            const floatOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return 3.14159;
            }
            
            const cachedNumberOperation = cache.rt.wrap("number_key", numberOperation);
            const cachedFloatOperation = cache.rt.wrap("float_key", floatOperation);
            
            const { result: numberResult, cacheKey: cacheKeyNumber } = await cachedNumberOperation();
            const { result: floatResult, cacheKey: cacheKeyFloat } = await cachedFloatOperation();
            
            expect(numberResult).to.eql(42);
            expect(floatResult).to.eql(3.14159);
            const cachedNumberValue = await cache.get(cacheKeyNumber);
            const cachedFloatValue = await cache.get(cacheKeyFloat);
            expect(cachedNumberValue?.value || cachedNumberValue).to.eql(42);
            expect(cachedFloatValue?.value || cachedFloatValue).to.eql(3.14159);
        })

        it("should handle array return values", async () => {
            const arrayOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return [1, 2, 3, "test", { key: "value" }];
            }
            
            const cachedArrayOperation = cache.rt.wrap("array_key", arrayOperation);
            const { result, cacheKey } = await cachedArrayOperation();
            const cachedArrayValue = await cache.get(cacheKey);
            expect(cachedArrayValue?.value || cachedArrayValue).to.eql([1, 2, 3, "test", { key: "value" }]);
        })

        it("should handle empty string return values", async () => {
            const emptyStringOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return "";
            }
            
            const cachedEmptyStringOperation = cache.rt.wrap("empty_string_key", emptyStringOperation);
            const { result, cacheKey } = await cachedEmptyStringOperation();
            
            expect(result).to.eql("");
            const cachedEmptyStringValue = await cache.get(cacheKey);
            expect(cachedEmptyStringValue?.value || cachedEmptyStringValue).to.eql("");
        })

        it("should handle zero return values", async () => {
            const zeroOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return 0;
            }
            
            const cachedZeroOperation = cache.rt.wrap("zero_key", zeroOperation);
            const { result, cacheKey } = await cachedZeroOperation();
            
            expect(result).to.eql(0);
            const cachedZeroValue = await cache.get(cacheKey);
            expect(cachedZeroValue?.value || cachedZeroValue).to.eql(0);
        })

        it("should handle function that returns a promise", async () => {
            const promiseOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return Promise.resolve("promise_result");
            }
            
            const cachedPromiseOperation = cache.rt.wrap("promise_key", promiseOperation);
            const { result, cacheKey } = await cachedPromiseOperation();
            
            expect(result).to.eql("promise_result");
            const cachedPromiseValue = await cache.get(cacheKey);
            expect(cachedPromiseValue?.value || cachedPromiseValue).to.eql("promise_result");
        })

        it("should handle function that throws after delay", async () => {
            const delayedFailingOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                throw new Error("Delayed failure");
            }
            
            const cachedDelayedFailingOperation = cache.rt.wrap("delayed_fail_key", delayedFailingOperation);
            
            try {
                await cachedDelayedFailingOperation();
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(error.message).to.eql("Delayed failure");
                // Should not cache failed operations
                const cachedDelayedFailValue = await cache.get("delayed_fail_key");
                expect(cachedDelayedFailValue?.value || cachedDelayedFailValue).to.be.undefined;
            }
        })

        it("should handle function that returns different types", async () => {
            const stringOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return "string_result";
            }
            
            const numberOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return 123;
            }
            
            const objectOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return { type: "object" };
            }
            
            const cachedStringOperation = cache.rt.wrap("string_key", stringOperation);
            const cachedNumberOperation = cache.rt.wrap("number_key", numberOperation);
            const cachedObjectOperation = cache.rt.wrap("object_key", objectOperation);
            
            const { result: stringResult, cacheKey: cacheKeyString } = await cachedStringOperation();
            const { result: numberResult, cacheKey: cacheKeyNumber } = await cachedNumberOperation();
            const { result: objectResult, cacheKey: cacheKeyObject } = await cachedObjectOperation();
            
            expect(stringResult).to.eql("string_result");
            expect(numberResult).to.eql(123);
            expect(objectResult).to.eql({ type: "object" });
            
            const cachedStringValue = await cache.get(cacheKeyString);
            const cachedNumberValue = await cache.get(cacheKeyNumber);
            const cachedObjectValue = await cache.get(cacheKeyObject);
            expect(cachedStringValue?.value || cachedStringValue).to.eql("string_result");
            expect(cachedNumberValue?.value || cachedNumberValue).to.eql(123);
            expect(cachedObjectValue?.value || cachedObjectValue).to.eql({ type: "object" });
        })

        it("should handle multiple arguments in wrapped function", async () => {
            const multiArgOperation = async (arg1, arg2, arg3) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return `${arg1}_${arg2}_${arg3}`;
            }
            
            const cachedMultiArgOperation = cache.rt.wrap("multi_arg_key", multiArgOperation);
            const { result, cacheKey } = await cachedMultiArgOperation("a", "b", "c");
            const cachedMultiArgValue = await cache.get(cacheKey);
            expect(cachedMultiArgValue?.value || cachedMultiArgValue).to.eql("a_b_c");
        })

        it("should handle wrapped function with no arguments", async () => {
            const noArgOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return "no_args_result";
            }
            
            const cachedNoArgOperation = cache.rt.wrap("no_arg_key", noArgOperation);
            const { result, cacheKey } = await cachedNoArgOperation();
            
            expect(result).to.eql("no_args_result");
            const cachedNoArgValue = await cache.get(cacheKey);
            expect(cachedNoArgValue?.value || cachedNoArgValue).to.eql("no_args_result");
        })

        it("should handle wrapped function with object arguments", async () => {
            const objectArgOperation = async (obj) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return `processed_${obj.name}_${obj.value}`;
            }
            
            const cachedObjectArgOperation = cache.rt.wrap("object_arg_key", objectArgOperation);
            const { result, cacheKey } = await cachedObjectArgOperation({ name: "test", value: 42 });
            
            expect(result).to.eql("processed_test_42");
            const cachedObjectArgValue = await cache.get(cacheKey);
            expect(cachedObjectArgValue?.value || cachedObjectArgValue).to.eql("processed_test_42");
        })

        it("should handle wrapped function with array arguments", async () => {
            const arrayArgOperation = async (arr) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return arr.join("_");
            }
            
            const cachedArrayArgOperation = cache.rt.wrap("array_arg_key", arrayArgOperation);
            const { result, cacheKey } = await cachedArrayArgOperation(["a", "b", "c"]);
            
            expect(result).to.eql("a_b_c");
            const cachedArrayArgValue = await cache.get(cacheKey);
            expect(cachedArrayArgValue?.value || cachedArrayArgValue).to.eql("a_b_c");
        })

        it("should handle wrapped function with mixed argument types", async () => {
            const mixedArgOperation = async (str, num, bool, obj) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return `${str}_${num}_${bool}_${obj.key}`;
            }
            
            const cachedMixedArgOperation = cache.rt.wrap("mixed_arg_key", mixedArgOperation);
            const { result, cacheKey } = await cachedMixedArgOperation("test", 42, true, { key: "value" });
            
            expect(result).to.eql("test_42_true_value");
            const cachedMixedArgValue = await cache.get(cacheKey);
            expect(cachedMixedArgValue?.value || cachedMixedArgValue).to.eql("test_42_true_value");
        })

        it("should handle wrapped function that modifies arguments", async () => {
            const modifyArgOperation = async (arr) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                arr.push("modified");
                return arr;
            }
            
            const cachedModifyArgOperation = cache.rt.wrap("modify_arg_key", modifyArgOperation);
            const originalArray = [1, 2, 3];
            const { result, cacheKey } = await cachedModifyArgOperation(originalArray);
            
            expect(result).to.eql([1, 2, 3, "modified"]);
            expect(originalArray).to.eql([1, 2, 3, "modified"]); // Original array is modified
            const cachedModifyArgValue = await cache.get(cacheKey);
            expect(cachedModifyArgValue?.value || cachedModifyArgValue).to.eql([1, 2, 3, "modified"]);
        })

        it("should handle wrapped function with async/await pattern", async () => {
            const asyncAwaitOperation = async () => {
                const data = await new Promise(resolve => setTimeout(() => resolve("async_data"), 100));
                const processed = await new Promise(resolve => setTimeout(() => resolve(`processed_${data}`), 50));
                return processed;
            }
            
            const cachedAsyncAwaitOperation = cache.rt.wrap("async_await_key", asyncAwaitOperation);
            const { result, cacheKey } = await cachedAsyncAwaitOperation();
            
            expect(result).to.eql("processed_async_data");
            const cachedAsyncAwaitValue = await cache.get(cacheKey);
            expect(cachedAsyncAwaitValue?.value || cachedAsyncAwaitValue).to.eql("processed_async_data");
        })

        // New tests for dynamic key generation
        it("should generate different cache keys for different function arguments", async () => {
            let executionCount = 0;
            const expensiveOperation = async (param1, param2) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `result_${param1}_${param2}_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("dynamic_key_test", expensiveOperation);
            
            // First call with different arguments
            const { result: result1, cacheKey: cacheKey1 } = await cachedOperation("A", "B");
            expect(result1).to.eql("result_A_B_1");
            expect(executionCount).to.eql(1);
            
            // Second call with different arguments - should execute again
            const { result: result2, cacheKey: cacheKey2 } = await cachedOperation("C", "D");
            expect(result2).to.eql("result_C_D_2");
            expect(executionCount).to.eql(2);
            
            // Third call with same arguments as first - should use cache
            const { result: result3, cacheKey: cacheKey3 } = await cachedOperation("A", "B");
            expect(result3).to.eql("result_A_B_1"); // Same as first result
            expect(executionCount).to.eql(2); // Function should not be called again
        })

        it("should work with custom template-based keys", async () => {
            let executionCount = 0;
            const expensiveOperation = async (userId, includeDetails) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `user_${userId}_${includeDetails}_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("user-profile", expensiveOperation, {
                key: { template: "profile:{args[0]}:{args[1]}:{hash}" }
            });
            
            const { result: result1, cacheKey: cacheKey1 } = await cachedOperation("user-123", true);
            const { result: result2, cacheKey: cacheKey2 } = await cachedOperation("user-123", false);
            const { result: result3, cacheKey: cacheKey3 } = await cachedOperation("user-123", true); // Should be cache hit
            
            expect(result1).to.eql("user_user-123_true_1");
            expect(result2).to.eql("user_user-123_false_2");
            expect(result3).to.eql("user_user-123_true_1"); // Same as first result
            expect(executionCount).to.eql(2); // Only 2 executions, third was cached
        })

        it("should handle context-aware key generation", async () => {
            let executionCount = 0;
            const expensiveOperation = async (dataId) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `tenant_data_${dataId}_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("tenant-data", expensiveOperation, {
                key: { template: "{tenant}:{user}:{args[0]}:{hash}" }
            });
            
            const { result: result1, cacheKey: cacheKey1 } = await cachedOperation("data-123");
            const { result: result2, cacheKey: cacheKey2 } = await cachedOperation("data-456");
            const { result: result3, cacheKey: cacheKey3 } = await cachedOperation("data-123"); // Should be cache hit
            
            expect(result1).to.eql("tenant_data_data-123_1");
            expect(result2).to.eql("tenant_data_data-456_2");
            expect(result3).to.eql("tenant_data_data-123_1"); // Same as first result
            expect(executionCount).to.eql(2); // Only 2 executions, third was cached
        })

        it("should handle complex object arguments", async () => {
            let executionCount = 0;
            const expensiveOperation = async (filter, options) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `filtered_${filter.active}_${options.limit}_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("complex-args", expensiveOperation);
            
            const filter1 = { active: true, type: "user" };
            const options1 = { limit: 10, offset: 0 };
            const filter2 = { active: false, type: "user" };
            const options2 = { limit: 20, offset: 0 };
            
            const { result: result1, cacheKey: cacheKey1 } = await cachedOperation(filter1, options1);
            const { result: result2, cacheKey: cacheKey2 } = await cachedOperation(filter2, options2);
            const { result: result3, cacheKey: cacheKey3 } = await cachedOperation(filter1, options1); // Should be cache hit
            
            expect(result1).to.eql("filtered_true_10_1");
            expect(result2).to.eql("filtered_false_20_2");
            expect(result3).to.eql("filtered_true_10_1"); // Same as first result
            expect(executionCount).to.eql(2); // Only 2 executions, third was cached
        })

        it("should handle array arguments", async () => {
            let executionCount = 0;
            const expensiveOperation = async (ids, sortBy) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `sorted_${ids.join('_')}_${sortBy.join('_')}_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("array-args", expensiveOperation);
            
            const { result: result1, cacheKey: cacheKey1 } = await cachedOperation([1, 2, 3], ["name", "asc"]);
            const { result: result2, cacheKey: cacheKey2 } = await cachedOperation([4, 5, 6], ["date", "desc"]);
            const { result: result3, cacheKey: cacheKey3 } = await cachedOperation([1, 2, 3], ["name", "asc"]); // Should be cache hit
            
            expect(result1).to.eql("sorted_1_2_3_name_asc_1");
            expect(result2).to.eql("sorted_4_5_6_date_desc_2");
            expect(result3).to.eql("sorted_1_2_3_name_asc_1"); // Same as first result
            expect(executionCount).to.eql(2); // Only 2 executions, third was cached
        })

        it("should handle null and undefined arguments", async () => {
            let executionCount = 0;
            const expensiveOperation = async (param1, param2) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `result_${param1}_${param2}_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("null-args", expensiveOperation);
            
            const { result: result1, cacheKey: cacheKey1 } = await cachedOperation(null, "defined");
            const { result: result2, cacheKey: cacheKey2 } = await cachedOperation(undefined, "defined");
            const { result: result3, cacheKey: cacheKey3 } = await cachedOperation(null, "defined"); // Should be cache hit
            
            expect(result1).to.eql("result_null_defined_1");
            expect(result2).to.eql("result_undefined_defined_2");
            expect(result3).to.eql("result_null_defined_1"); // Same as first result
            expect(executionCount).to.eql(2); // Only 2 executions, third was cached
        })

        it("should handle functions with no arguments", async () => {
            let executionCount = 0;
            const expensiveOperation = async () => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `no_args_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("no-args", expensiveOperation);
            
            const { result: result1, cacheKey: cacheKey1 } = await cachedOperation();
            const { result: result2, cacheKey: cacheKey2 } = await cachedOperation(); // Should be cache hit
            
            expect(result1).to.eql("no_args_1");
            expect(result2).to.eql("no_args_1"); // Same as first result
            expect(executionCount).to.eql(1); // Only 1 execution, second was cached
        })

    })

    describe('rt.exec', () => {

        it("should execute an async function and cache the result", async () => {
            const expensiveOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return ["expensive", "result"];
            }
            const { result, cacheKey } = await cache.rt.exec("key", expensiveOperation);
            expect(result).to.eql(["expensive", "result"]);
            const cachedValue = await cache.get(cacheKey);
            expect(result).to.eql(cachedValue?.value || cachedValue);
        })

        it("should return cached result on subsequent executions", async () => {
            let executionCount = 0;
            const expensiveOperation = async () => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return ["expensive", "result", executionCount];
            }
            
            // First execution - should execute the function
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("key", expensiveOperation);
            expect(result1).to.eql(["expensive", "result", 1]);
            const cachedValue1 = await cache.get(cacheKey1);
            expect(result1).to.eql(cachedValue1?.value || cachedValue1);
            expect(executionCount).to.eql(1);

            // Second execution - should return cached result
            const { result: result2, cacheKey: cacheKey2 } = await cache.rt.exec("key", expensiveOperation);
            expect(result2).to.eql(["expensive", "result", 1]); // Same as first result
            expect(executionCount).to.eql(1); // Function should not be called again
        })

        it("should execute function with arguments", async () => {
            const expensiveOperation = async (value, multiplier) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return value * multiplier;
            }
            const { result, cacheKey } = await cache.rt.exec("key", expensiveOperation, [5, 3]);
            expect(result).to.eql(15);
            const cachedValue = await cache.get(cacheKey);
            expect(result).to.eql(cachedValue?.value || cachedValue);
        })

        it("should respect TTL settings", async () => {
            const expensiveOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return "cached_value";
            }
            
            // Execute with 1 second TTL
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("key", expensiveOperation, [], { ttl: 1000 });
            expect(result1).to.eql("cached_value");
            const cachedValue1 = await cache.get(cacheKey1);
            expect(cachedValue1?.value || cachedValue1).to.eql("cached_value");

            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Should be undefined after TTL expires
            const cachedValue2 = await cache.get(cacheKey1);
            expect(cachedValue2?.value || cachedValue2).to.be.undefined;
        })

        it("should handle different keys independently", async () => {
            const expensiveOperation = async (value) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return `result_${value}`;
            }
            
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("key1", () => expensiveOperation("A"));
            const { result: result2, cacheKey: cacheKey2 } = await cache.rt.exec("key2", () => expensiveOperation("B"));
            
            expect(result1).to.eql("result_A");
            expect(result2).to.eql("result_B");
            const cachedValue1 = await cache.get(cacheKey1);
            const cachedValue2 = await cache.get(cacheKey2);
            expect(cachedValue1?.value || cachedValue1).to.eql("result_A");
            expect(cachedValue2?.value || cachedValue2).to.eql("result_B");
        })

        it("should handle function errors gracefully", async () => {
            const failingOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                throw new Error("Function failed");
            }
            
            try {
                await cache.rt.exec("key", failingOperation, [], { key: { template: "key" } });
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(error.message).to.eql("Function failed");
                // Should not cache failed operations
                const cachedValue = await cache.get("key");
                expect(cachedValue?.value || cachedValue).to.be.undefined;
            }
        })

        it("should handle complex return values", async () => {
            const complexOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return {
                    data: ["item1", "item2"],
                    metadata: {
                        count: 2,
                        timestamp: Date.now()
                    },
                    nested: {
                        deep: {
                            value: "test"
                        }
                    }
                };
            }
            
            const { result, cacheKey } = await cache.rt.exec("key", complexOperation);
            expect(result).to.have.property('data').that.eql(["item1", "item2"]);
            expect(result).to.have.property('metadata').that.has.property('count', 2);
            expect(result).to.have.property('nested').that.has.property('deep').that.has.property('value', 'test');
            const cachedValue = await cache.get(cacheKey);
            expect(result).to.eql(cachedValue?.value || cachedValue);
        })

        it("should work with tags", async () => {
            const expensiveOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return "tagged_value";
            }
            
            const { result, cacheKey } = await cache.rt.exec("key", expensiveOperation, [], { tags: ["tag1", "tag2"] });
            expect(result).to.eql("tagged_value");
            
            // Verify tags are stored
            const metadata = await cache.metadata(cacheKey);
            expect(metadata.tags).to.include("tag1");
            expect(metadata.tags).to.include("tag2");
        })

        it("should handle null and undefined return values", async () => {
            const nullOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return null;
            }
            
            const undefinedOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return undefined;
            }
            
            const { result: nullResult, cacheKey: cacheKeyNull } = await cache.rt.exec("null_key", nullOperation);
            const { result: undefinedResult, cacheKey: cacheKeyUndefined } = await cache.rt.exec("undefined_key", undefinedOperation);
            
            expect(nullResult).to.be.null;
            expect(undefinedResult).to.be.undefined;
            const cachedNullValue = await cache.get(cacheKeyNull);
            const cachedUndefinedValue = await cache.get(cacheKeyUndefined);
            expect(cachedNullValue?.value || cachedNullValue).to.be.null;
            expect(cachedUndefinedValue?.value || cachedUndefinedValue).to.be.undefined;
        })

        it("should handle boolean return values", async () => {
            const trueOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return true;
            }
            
            const falseOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return false;
            }
            
            const { result: trueResult, cacheKey: cacheKeyTrue } = await cache.rt.exec("true_key", trueOperation);
            const { result: falseResult, cacheKey: cacheKeyFalse } = await cache.rt.exec("false_key", falseOperation);
            
            expect(trueResult).to.be.true;
            expect(falseResult).to.be.false;
            const cachedTrueValue = await cache.get(cacheKeyTrue);
            const cachedFalseValue = await cache.get(cacheKeyFalse);
            expect(cachedTrueValue?.value || cachedTrueValue).to.be.true;
            expect(cachedFalseValue?.value || cachedFalseValue).to.be.false;
        })

        it("should handle numeric return values", async () => {
            const numberOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return 42;
            }
            
            const floatOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return 3.14159;
            }
            
            const { result: numberResult, cacheKey: cacheKeyNumber } = await cache.rt.exec("number_key", numberOperation);
            const { result: floatResult, cacheKey: cacheKeyFloat } = await cache.rt.exec("float_key", floatOperation);
            
            expect(numberResult).to.eql(42);
            expect(floatResult).to.eql(3.14159);
            const cachedNumberValue = await cache.get(cacheKeyNumber);
            const cachedFloatValue = await cache.get(cacheKeyFloat);
            expect(cachedNumberValue?.value || cachedNumberValue).to.eql(42);
            expect(cachedFloatValue?.value || cachedFloatValue).to.eql(3.14159);
        })

        it("should handle array return values", async () => {
            const arrayOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return [1, 2, 3, "test", { key: "value" }];
            }
            
            const { result, cacheKey } = await cache.rt.exec("array_key", arrayOperation);
            expect(result).to.eql([1, 2, 3, "test", { key: "value" }]);
            const cachedArrayValue = await cache.get(cacheKey);
            expect(cachedArrayValue?.value || cachedArrayValue).to.eql([1, 2, 3, "test", { key: "value" }]);
        })

        it("should handle empty string return values", async () => {
            const emptyStringOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return "";
            }
            
            const { result, cacheKey } = await cache.rt.exec("empty_string_key", emptyStringOperation);
            expect(result).to.eql("");
            const cachedEmptyStringValue = await cache.get(cacheKey);
            expect(cachedEmptyStringValue?.value || cachedEmptyStringValue).to.eql("");
        })

        it("should handle zero return values", async () => {
            const zeroOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return 0;
            }
            
            const { result, cacheKey } = await cache.rt.exec("zero_key", zeroOperation);
            expect(result).to.eql(0);
            const cachedZeroValue = await cache.get(cacheKey);
            expect(cachedZeroValue?.value || cachedZeroValue).to.eql(0);
        })

        it("should handle function that returns a promise", async () => {
            const promiseOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return Promise.resolve("promise_result");
            }
            
            const { result, cacheKey } = await cache.rt.exec("promise_key", promiseOperation);
            expect(result).to.eql("promise_result");
            const cachedPromiseValue = await cache.get(cacheKey);
            expect(cachedPromiseValue?.value || cachedPromiseValue).to.eql("promise_result");
        })

        it("should handle function that throws after delay", async () => {
            const delayedFailingOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                throw new Error("Delayed failure");
            }
            
            try {
                await cache.rt.exec("delayed_fail_key", delayedFailingOperation, [], { key: { template: "key" } });
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(error.message).to.eql("Delayed failure");
                // Should not cache failed operations
                const cachedDelayedFailValue = await cache.get("key");
                expect(cachedDelayedFailValue?.value || cachedDelayedFailValue).to.be.undefined;
            }
        })

        it("should handle function that returns different types", async () => {
            const stringOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return "string_result";
            }
            
            const numberOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return 123;
            }
            
            const objectOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return { type: "object" };
            }
            
            const { result: stringResult, cacheKey: cacheKeyString } = await cache.rt.exec("string_key", stringOperation);
            const { result: numberResult, cacheKey: cacheKeyNumber } = await cache.rt.exec("number_key", numberOperation);
            const { result: objectResult, cacheKey: cacheKeyObject } = await cache.rt.exec("object_key", objectOperation);
            
            expect(stringResult).to.eql("string_result");
            expect(numberResult).to.eql(123);
            expect(objectResult).to.eql({ type: "object" });
            
            const cachedStringValue = await cache.get(cacheKeyString);
            const cachedNumberValue = await cache.get(cacheKeyNumber);
            const cachedObjectValue = await cache.get(cacheKeyObject);
            expect(cachedStringValue?.value || cachedStringValue).to.eql("string_result");
            expect(cachedNumberValue?.value || cachedNumberValue).to.eql(123);
            expect(cachedObjectValue?.value || cachedObjectValue).to.eql({ type: "object" });
        })

        // New tests for rt.exec with dynamic key generation
        it("should generate different cache keys for different function arguments in exec", async () => {
            let executionCount = 0;
            const expensiveOperation = async (param1, param2) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `exec_result_${param1}_${param2}_${executionCount}`;
            }
            
            // First execution with different arguments
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("exec_dynamic_test", expensiveOperation, ["A", "B"]);
            expect(result1).to.eql("exec_result_A_B_1");
            expect(executionCount).to.eql(1);
            
            // Second execution with different arguments - should execute again
            const { result: result2, cacheKey: cacheKey2 } = await cache.rt.exec("exec_dynamic_test", expensiveOperation, ["C", "D"]);
            expect(result2).to.eql("exec_result_C_D_2");
            expect(executionCount).to.eql(2);
            
            // Third execution with same arguments as first - should use cache
            const { result: result3, cacheKey: cacheKey3 } = await cache.rt.exec("exec_dynamic_test", expensiveOperation, ["A", "B"]);
            expect(result3).to.eql("exec_result_A_B_1"); // Same as first result
            expect(executionCount).to.eql(2); // Function should not be called again
        })

        it("should work with custom template-based keys in exec", async () => {
            let executionCount = 0;
            const expensiveOperation = async (userId, includeDetails) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `exec_user_${userId}_${includeDetails}_${executionCount}`;
            }
            
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("exec-user-profile", expensiveOperation, ["user-123", true], {
                key: { template: "exec_profile:{args[0]}:{args[1]}:{hash}" }
            });
            const { result: result2, cacheKey: cacheKey2 } = await cache.rt.exec("exec-user-profile", expensiveOperation, ["user-123", false], {
                key: { template: "exec_profile:{args[0]}:{args[1]}:{hash}" }
            });
            const { result: result3, cacheKey: cacheKey3 } = await cache.rt.exec("exec-user-profile", expensiveOperation, ["user-123", true], {
                key: { template: "exec_profile:{args[0]}:{args[1]}:{hash}" }
            }); // Should be cache hit
            
            expect(result1).to.eql("exec_user_user-123_true_1");
            expect(result2).to.eql("exec_user_user-123_false_2");
            expect(result3).to.eql("exec_user_user-123_true_1"); // Same as first result
            expect(executionCount).to.eql(2); // Only 2 executions, third was cached
        })

        it("should handle context-aware key generation in exec", async () => {
            let executionCount = 0;
            const expensiveOperation = async (dataId) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `exec_tenant_data_${dataId}_${executionCount}`;
            }
            
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("exec-tenant-data", expensiveOperation, ["data-123"], {
                key: { template: "{tenant}:{user}:exec:{args[0]}:{hash}" }
            });
            const { result: result2, cacheKey: cacheKey2 } = await cache.rt.exec("exec-tenant-data", expensiveOperation, ["data-456"], {
                key: { template: "{tenant}:{user}:exec:{args[0]}:{hash}" }
            });
            const { result: result3, cacheKey: cacheKey3 } = await cache.rt.exec("exec-tenant-data", expensiveOperation, ["data-123"], {
                key: { template: "{tenant}:{user}:exec:{args[0]}:{hash}" }
            }); // Should be cache hit
            
            expect(result1).to.eql("exec_tenant_data_data-123_1");
            expect(result2).to.eql("exec_tenant_data_data-456_2");
            expect(result3).to.eql("exec_tenant_data_data-123_1"); // Same as first result
            expect(executionCount).to.eql(2); // Only 2 executions, third was cached
        })

        it("should handle complex object arguments in exec", async () => {
            let executionCount = 0;
            const expensiveOperation = async (filter, options) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `exec_filtered_${filter.active}_${options.limit}_${executionCount}`;
            }
            
            const filter1 = { active: true, type: "user" };
            const options1 = { limit: 10, offset: 0 };
            const filter2 = { active: false, type: "user" };
            const options2 = { limit: 20, offset: 0 };
            
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("exec-complex-args", expensiveOperation, [filter1, options1]);
            const { result: result2, cacheKey: cacheKey2 } = await cache.rt.exec("exec-complex-args", expensiveOperation, [filter2, options2]);
            const { result: result3, cacheKey: cacheKey3 } = await cache.rt.exec("exec-complex-args", expensiveOperation, [filter1, options1]); // Should be cache hit
            
            expect(result1).to.eql("exec_filtered_true_10_1");
            expect(result2).to.eql("exec_filtered_false_20_2");
            expect(result3).to.eql("exec_filtered_true_10_1"); // Same as first result
            expect(executionCount).to.eql(2); // Only 2 executions, third was cached
        })

        it("should handle array arguments in exec", async () => {
            let executionCount = 0;
            const expensiveOperation = async (ids, sortBy) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `exec_sorted_${ids.join('_')}_${sortBy.join('_')}_${executionCount}`;
            }
            
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("exec-array-args", expensiveOperation, [[1, 2, 3], ["name", "asc"]]);
            const { result: result2, cacheKey: cacheKey2 } = await cache.rt.exec("exec-array-args", expensiveOperation, [[4, 5, 6], ["date", "desc"]]);
            const { result: result3, cacheKey: cacheKey3 } = await cache.rt.exec("exec-array-args", expensiveOperation, [[1, 2, 3], ["name", "asc"]]); // Should be cache hit
            
            expect(result1).to.eql("exec_sorted_1_2_3_name_asc_1");
            expect(result2).to.eql("exec_sorted_4_5_6_date_desc_2");
            expect(result3).to.eql("exec_sorted_1_2_3_name_asc_1"); // Same as first result
            expect(executionCount).to.eql(2); // Only 2 executions, third was cached
        })

        it("should handle null and undefined arguments in exec", async () => {
            let executionCount = 0;
            const expensiveOperation = async (param1, param2) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `exec_result_${param1}_${param2}_${executionCount}`;
            }
            
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("exec-null-args", expensiveOperation, [null, "defined"]);
            const { result: result2, cacheKey: cacheKey2 } = await cache.rt.exec("exec-null-args", expensiveOperation, [undefined, "defined"]);
            const { result: result3, cacheKey: cacheKey3 } = await cache.rt.exec("exec-null-args", expensiveOperation, [null, "defined"]); // Should be cache hit
            
            expect(result1).to.eql("exec_result_null_defined_1");
            expect(result2).to.eql("exec_result_undefined_defined_2");
            expect(result3).to.eql("exec_result_null_defined_1"); // Same as first result
            expect(executionCount).to.eql(2); // Only 2 executions, third was cached
        })

        it("should handle functions with no arguments in exec", async () => {
            let executionCount = 0;
            const expensiveOperation = async () => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `exec_no_args_${executionCount}`;
            }
            
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("exec-no-args", expensiveOperation, []);
            const { result: result2, cacheKey: cacheKey2 } = await cache.rt.exec("exec-no-args", expensiveOperation, []); // Should be cache hit
            
            expect(result1).to.eql("exec_no_args_1");
            expect(result2).to.eql("exec_no_args_1"); // Same as first result
            expect(executionCount).to.eql(1); // Only 1 execution, second was cached
        })

        // Tests for detailed mode functionality
        it("should return detailed result with cache key for wrap when detailed mode is enabled", async () => {
            let executionCount = 0;
            const expensiveOperation = async (param1, param2) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `detailed_result_${param1}_${param2}_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("detailed-test", expensiveOperation, { detailed: true });
            
            // First call - should execute and return detailed result
            const detailedResult1 = await cachedOperation("A", "B");
            expect(detailedResult1).to.have.property('result').that.eql("detailed_result_A_B_1");
            expect(detailedResult1).to.have.property('cacheKey').that.is.a('string');
            expect(detailedResult1).to.have.property('metadata').that.has.property('hit', false);
            expect(detailedResult1).to.have.property('metadata').that.has.property('latency').that.is.a('number');
            expect(executionCount).to.eql(1);
            
            // Second call with same arguments - should be cache hit
            const detailedResult2 = await cachedOperation("A", "B");
            expect(detailedResult2).to.have.property('result').that.eql("detailed_result_A_B_1");
            expect(detailedResult2).to.have.property('cacheKey').that.eql(detailedResult1.cacheKey);
            expect(detailedResult2).to.have.property('metadata').that.has.property('hit', true);
            expect(detailedResult2).to.have.property('metadata').that.has.property('latency').that.is.a('number');
            expect(executionCount).to.eql(1); // Function should not be called again
        })

        it("should return detailed result with cache key for exec when detailed mode is enabled", async () => {
            let executionCount = 0;
            const expensiveOperation = async (param1, param2) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `detailed_exec_result_${param1}_${param2}_${executionCount}`;
            }
            
            // First execution - should execute and return detailed result
            const detailedResult1 = await cache.rt.exec("detailed-exec-test", expensiveOperation, ["A", "B"], { detailed: true });
            expect(detailedResult1).to.have.property('result').that.eql("detailed_exec_result_A_B_1");
            expect(detailedResult1).to.have.property('cacheKey').that.is.a('string');
            expect(detailedResult1).to.have.property('metadata').that.has.property('hit', false);
            expect(detailedResult1).to.have.property('metadata').that.has.property('latency').that.is.a('number');
            expect(executionCount).to.eql(1);
            
            // Second execution with same arguments - should be cache hit
            const detailedResult2 = await cache.rt.exec("detailed-exec-test", expensiveOperation, ["A", "B"], { detailed: true });
            expect(detailedResult2).to.have.property('result').that.eql("detailed_exec_result_A_B_1");
            expect(detailedResult2).to.have.property('cacheKey').that.eql(detailedResult1.cacheKey);
            expect(detailedResult2).to.have.property('metadata').that.has.property('hit', true);
            expect(detailedResult2).to.have.property('metadata').that.has.property('latency').that.is.a('number');
            expect(executionCount).to.eql(1); // Function should not be called again
        })

        it("should generate different cache keys for different arguments in detailed mode", async () => {
            let executionCount = 0;
            const expensiveOperation = async (param1, param2) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `different_keys_${param1}_${param2}_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("different-keys-test", expensiveOperation, { detailed: true });
            
            // First call with different arguments
            const detailedResult1 = await cachedOperation("A", "B");
            const detailedResult2 = await cachedOperation("C", "D");
            
            // Should have different cache keys
            expect(detailedResult1.cacheKey).to.not.equal(detailedResult2.cacheKey);
            expect(detailedResult1.metadata.hit).to.be.false;
            expect(detailedResult2.metadata.hit).to.be.false;
            expect(executionCount).to.eql(2);
            
            // Third call with same arguments as first - should be cache hit
            const detailedResult3 = await cachedOperation("A", "B");
            expect(detailedResult3.cacheKey).to.equal(detailedResult1.cacheKey);
            expect(detailedResult3.metadata.hit).to.be.true;
            expect(executionCount).to.eql(2); // Function should not be called again
        })

        it("should work with custom templates in detailed mode", async () => {
            let executionCount = 0;
            const expensiveOperation = async (userId, includeDetails) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `template_user_${userId}_${includeDetails}_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("template-test", expensiveOperation, {
                key: { template: "template:{args[0]}:{args[1]}:{hash}" },
                detailed: true
            });
            
            const detailedResult = await cachedOperation("user-123", true);
            
            expect(detailedResult).to.have.property('result').that.eql("template_user_user-123_true_1");
            expect(detailedResult).to.have.property('cacheKey').that.matches(/^template:user-123:true:/);
            expect(detailedResult).to.have.property('metadata').that.has.property('hit', false);
            expect(executionCount).to.eql(1);
        })

        it("should maintain backward compatibility for exec when detailed mode is not enabled", async () => {
            let executionCount = 0;
            const expensiveOperation = async (param1, param2) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return `backward_compat_exec_${param1}_${param2}_${executionCount}`;
            }
            
            // Should return just the result (not an object)
            const { result: result1, cacheKey: cacheKey1 } = await cache.rt.exec("backward-compat-exec-test", expensiveOperation, ["A", "B"]);
            expect(result1).to.eql("backward_compat_exec_A_B_1");
            expect(result1).to.not.have.property('cacheKey');
            expect(result1).to.not.have.property('metadata');
            expect(executionCount).to.eql(1);
            
            // Second execution should also return just the result
            const { result: result2, cacheKey: cacheKey2 } = await cache.rt.exec("backward-compat-exec-test", expensiveOperation, ["A", "B"]);
            expect(result2).to.eql("backward_compat_exec_A_B_1");
            expect(result2).to.not.have.property('cacheKey');
            expect(result2).to.not.have.property('metadata');
            expect(executionCount).to.eql(1); // Function should not be called again
        })

        it("should provide useful metadata", async () => {
            let executionCount = 0;
            const expensiveOperation = async (param1) => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 50));
                return `metadata_test_${param1}_${executionCount}`;
            }
            
            const cachedOperation = cache.rt.wrap("metadata-test", expensiveOperation);
            
            // First call - should be a miss
            const detailedResult1 = await cachedOperation("test");
            expect(detailedResult1.metadata.hit).to.be.false;
            expect(detailedResult1.metadata.latency).to.be.a('number');
            expect(detailedResult1.metadata.latency).to.be.greaterThan(0);
            
            // Second call - should be a hit
            const detailedResult2 = await cachedOperation("test");
            expect(detailedResult2.metadata.hit).to.be.true;
            expect(detailedResult2.metadata.latency).to.be.a('number');
            expect(detailedResult2.metadata.latency).to.be.greaterThan(0);
            
            // Hit should be faster than miss
            expect(detailedResult2.metadata.latency).to.be.lessThan(detailedResult1.metadata.latency);
        })

    })
})