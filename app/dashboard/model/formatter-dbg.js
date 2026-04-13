sap.ui.define(["sap/m/library"], function (sap_m_library) {
  "use strict";

  const ValueColor = sap_m_library["ValueColor"];
  /**
   * Formatter utility for cache statistics dashboard
   */
  var __exports = {
    booleanToText(value) {
      return value ? "Yes" : "No";
    },
    formatIntegerValue(value) {
      if (value === null || value === undefined || value === 0) {
        return "0";
      }
      return `${value.toFixed(0)}`;
    },
    formatNumberValue(value) {
      if (value === null || value === undefined || value === 0) {
        return "0";
      }
      return `${value.toFixed(2)}`;
    },
    /**
     * Format percentage values
     */
    formatPercentage(value) {
      if (value === null || value === undefined) {
        return "0%";
      }
      return `${(value * 100).toFixed(1)}%`;
    },
    formatPercentageValue(value) {
      if (value === null || value === undefined) {
        return "0";
      }
      return `${(value * 100).toFixed(1)}`;
    },
    /**
     * Format latency values in milliseconds
     */
    formatLatency(value) {
      if (value === null || value === undefined) {
        return "0ms";
      }
      // Make sure value is a number
      const numberValue = Number(value);
      if (numberValue < 1) {
        return `${(numberValue * 1000).toFixed(2)}μs`;
      }
      return `${numberValue.toFixed(2)}ms`;
    },
    /**
     * Format memory usage in human readable format
     */
    formatMemoryUsage(bytes) {
      if (bytes === null || bytes === undefined) {
        return "0 B";
      }
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    },
    /**
     * Format throughput (requests per second)
     */
    formatThroughput(value) {
      if (value === null || value === undefined) {
        return "0 req/s";
      }
      return `${value.toFixed(2)} req/s`;
    },
    /**
     * Format cache efficiency ratio
     */
    formatCacheEfficiency(value) {
      if (value === null || value === undefined || value === 0) {
        return "N/A";
      }
      if (value < 1) {
        return `${(value * 100).toFixed(1)}%`;
      }
      return `${value.toFixed(1)}x`;
    },
    /**
     * Format uptime in human readable format
     */
    formatUptime(ms) {
      if (ms === null || ms === undefined) {
        return "0s";
      }
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    },
    /**
     * Format date for display
     */
    formatDate(dateString) {
      if (!dateString) {
        return "";
      }
      const date = new Date(dateString);
      return date.toLocaleString();
    },
    /**
     * Format hit ratio with color indication
     */
    formatHitRatioWithColor(value) {
      if (value === null || value === undefined) {
        return ValueColor.None;
      }
      if (value >= 0.9) {
        return ValueColor.Good;
      } else if (value >= 0.7) {
        return ValueColor.Critical;
      } else {
        return ValueColor.Error;
      }
    },
    /**
     * Format latency with color indication
     */
    formatLatencyWithColor(value) {
      if (value === null || value === undefined) {
        return ValueColor.None;
      }
      if (value <= 10) {
        return ValueColor.Good;
      } else if (value <= 50) {
        return ValueColor.Critical;
      } else {
        return ValueColor.Error;
      }
    },
    /**
     * Format error rate with color indication
     */
    formatErrorRateWithColor(value) {
      if (value <= 0.01) {
        return ValueColor.Good;
      } else if (value <= 0.05) {
        return ValueColor.Critical;
      } else if (value <= 0.1) {
        return ValueColor.Error;
      } else {
        return ValueColor.Neutral;
      }
    },
    /**
     * Get total requests (hits + misses)
     */
    getTotalRequests(hits, misses) {
      return (hits || 0) + (misses || 0);
    },
    /**
     * Get total operations (hits + misses + sets + deletes)
     */
    getTotalOperations(hits, misses, sets, deletes) {
      return (hits || 0) + (misses || 0) + (sets || 0) + (deletes || 0);
    },
    /**
     * Format JSON for display
     */
    formatJSON(value) {
      if (!value) {
        return "";
      }
      try {
        if (typeof value === 'string') {
          // Try to parse and format if it's a JSON string
          const parsed = JSON.parse(value);
          return JSON.stringify(parsed, null, 2);
        } else {
          // Format if it's already an object
          return JSON.stringify(value, null, 2);
        }
      } catch (e) {
        // Return as-is if it's not valid JSON
        return value;
      }
    },
    /**
     * Format key name for display (truncate if too long)
     */
    formatKeyName(keyName, maxLength = 30) {
      if (!keyName) {
        return "";
      }
      if (keyName.length <= maxLength) {
        return keyName;
      }
      return keyName.substring(0, maxLength - 3) + "...";
    },
    /**
     * Get relative time since last access
     */
    getRelativeTime(dateString) {
      if (!dateString) {
        return "Never";
      }
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return `${diffSeconds} second${diffSeconds > 1 ? 's' : ''} ago`;
      }
    },
    /**
     * Format cache efficiency with color indication
     */
    formatCacheEfficiencyWithColor(value) {
      if (value === null || value === undefined) {
        return ValueColor.None;
      }
      if (value > 5) {
        return ValueColor.Good;
      } else if (value >= 3) {
        return ValueColor.Critical;
      } else {
        return ValueColor.Error;
      }
    },
    formatTruncatedText(value, maxLength = 50) {
      if (!value) {
        return "";
      }
      if (value.length <= maxLength) {
        return value;
      }
      return value.substring(0, maxLength) + "...";
    }
  };
  return __exports;
});
//# sourceMappingURL=formatter-dbg.js.map
