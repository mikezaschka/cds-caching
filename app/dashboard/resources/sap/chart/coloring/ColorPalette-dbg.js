/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([], function(
) {
	"use strict";
	var Palette = {};

	Palette.CRITICALITY = {
		Positive: [
		    'sapUiChartPaletteSemanticGoodLight3',
		    'sapUiChartPaletteSemanticGoodLight2',
		    'sapUiChartPaletteSemanticGoodLight1',
		    'sapUiChartPaletteSemanticGood',
		    'sapUiChartPaletteSemanticGoodDark1',
		    'sapUiChartPaletteSemanticGoodDark2'
		],
		Critical: [
			'sapUiChartPaletteSemanticCriticalLight3',
			'sapUiChartPaletteSemanticCriticalLight2',
			'sapUiChartPaletteSemanticCriticalLight1',
			'sapUiChartPaletteSemanticCritical',
			'sapUiChartPaletteSemanticCriticalDark1',
			'sapUiChartPaletteSemanticCriticalDark2'
		],
		Negative: [
			'sapUiChartPaletteSemanticBadLight3',
			'sapUiChartPaletteSemanticBadLight2',
			'sapUiChartPaletteSemanticBadLight1',
			'sapUiChartPaletteSemanticBad',
			'sapUiChartPaletteSemanticBadDark1',
			'sapUiChartPaletteSemanticBadDark2'
		],
		Neutral: [
			'sapUiChartPaletteSemanticNeutralLight3',
			'sapUiChartPaletteSemanticNeutralLight2',
			'sapUiChartPaletteSemanticNeutralLight1',
			'sapUiChartPaletteSemanticNeutral',
			'sapUiChartPaletteSemanticNeutralDark1',
			'sapUiChartPaletteSemanticNeutralDark2'
		]
	};

	Palette.EMPHASIS = {
		Highlight: "sapUiChartPaletteQualitativeHue2",
		Others: "sapUiChartPaletteQualitativeHue1"
	};

	Palette.GRADATION = {
		SingleColorScheme: {
			NoSemantics: [
				'sapUiChartPaletteSemanticNeutralLight3',
				'sapUiChartPaletteSemanticNeutralLight2',
				'sapUiChartPaletteSemanticNeutralLight1',
				'sapUiChartPaletteSemanticNeutral',
				'sapUiChartPaletteSemanticNeutralDark1',
				'sapUiChartPaletteSemanticNeutralDark2'
			],
			Positive: [
				'sapUiChartPaletteSemanticGoodLight3',
			    'sapUiChartPaletteSemanticGoodLight2',
			    'sapUiChartPaletteSemanticGoodLight1',
			    'sapUiChartPaletteSemanticGood',
			    'sapUiChartPaletteSemanticGoodDark1',
			    'sapUiChartPaletteSemanticGoodDark2'
			],
			Negative: [
				'sapUiChartPaletteSemanticBadLight3',
				'sapUiChartPaletteSemanticBadLight2',
				'sapUiChartPaletteSemanticBadLight1',
				'sapUiChartPaletteSemanticBad',
				'sapUiChartPaletteSemanticBadDark1',
				'sapUiChartPaletteSemanticBadDark2'
			]
		},
		DivergingColorScheme: {
			NoSemantics: [
				'sapUiChartPaletteNoSemDiv1Dark2',
				'sapUiChartPaletteNoSemDiv1Dark1',
				'sapUiChartPaletteNoSemDiv1',
				'sapUiChartPaletteNoSemDiv1Light1',
				'sapUiChartPaletteNoSemDiv1Light2',
				'sapUiChartPaletteNoSemDiv1Light3',
				'sapUiChartPaletteSequentialNeutral',
				'sapUiChartPaletteSequentialHue6Light3',
				'sapUiChartPaletteSequentialHue6Light2',
				'sapUiChartPaletteSequentialHue6Light1',
				'sapUiChartPaletteSequentialHue6',
				'sapUiChartPaletteSequentialHue6Dark1',
				'sapUiChartPaletteSequentialHue6Dark2'
			],
			PositiveToNegative: [
				'sapUiChartPaletteSemanticGoodDark2',
				'sapUiChartPaletteSemanticGoodDark1',
				'sapUiChartPaletteSemanticGood',
				'sapUiChartPaletteSemanticGoodLight1',
				'sapUiChartPaletteSemanticGoodLight2',
				'sapUiChartPaletteSemanticGoodLight3',
			    'sapUiChartPaletteSequentialNeutral',
			    'sapUiChartPaletteSemanticBadLight3',
				'sapUiChartPaletteSemanticBadLight2',
				'sapUiChartPaletteSemanticBadLight1',
				'sapUiChartPaletteSemanticBad',
				'sapUiChartPaletteSemanticBadDark1',
				'sapUiChartPaletteSemanticBadDark2'
			],
			NegativeToPositive: [
				'sapUiChartPaletteSemanticBadDark2',
			    'sapUiChartPaletteSemanticBadDark1',
			    'sapUiChartPaletteSemanticBad',
			    'sapUiChartPaletteSemanticBadLight1',
				'sapUiChartPaletteSemanticBadLight2',
				'sapUiChartPaletteSemanticBadLight3',
				'sapUiChartPaletteSequentialNeutral',
				'sapUiChartPaletteSemanticGoodLight3',
			    'sapUiChartPaletteSemanticGoodLight2',
			    'sapUiChartPaletteSemanticGoodLight1',
			    'sapUiChartPaletteSemanticGood',
			    'sapUiChartPaletteSemanticGoodDark1',
			    'sapUiChartPaletteSemanticGoodDark2'
			],
			ColdToHot: [
				'sapUiChartPaletteSequentialHue1Dark2',
				'sapUiChartPaletteSequentialHue1Dark1',
				'sapUiChartPaletteSequentialHue1',
				'sapUiChartPaletteSequentialHue1Light1',
				'sapUiChartPaletteSequentialHue1Light2',
				'sapUiChartPaletteSequentialHue1Light3',
			    'sapUiChartPaletteSequentialNeutral',
			    'sapUiChartPaletteSemanticBadLight3',
				'sapUiChartPaletteSemanticBadLight2',
				'sapUiChartPaletteSemanticBadLight1',
				'sapUiChartPaletteSemanticBad',
				'sapUiChartPaletteSemanticBadDark1',
				'sapUiChartPaletteSemanticBadDark2'
			],
			HotToCold: [
				'sapUiChartPaletteSemanticBadDark2',
			    'sapUiChartPaletteSemanticBadDark1',
			    'sapUiChartPaletteSemanticBad',
			    'sapUiChartPaletteSemanticBadLight1',
				'sapUiChartPaletteSemanticBadLight2',
				'sapUiChartPaletteSemanticBadLight3',
				'sapUiChartPaletteSequentialNeutral',
				'sapUiChartPaletteSequentialHue1Light3',
				'sapUiChartPaletteSequentialHue1Light2',
				'sapUiChartPaletteSequentialHue1Light1',
				'sapUiChartPaletteSequentialHue1',
				'sapUiChartPaletteSequentialHue1Dark1',
				'sapUiChartPaletteSequentialHue1Dark2'
			]
		},
		TargetColorScheme: {
			PositiveTarget: [
			    'sapUiChartPaletteSemanticBad',
				'sapUiChartPaletteSemanticBadLight2',
			    'sapUiChartPaletteSemanticCriticalLight1',
				'sapUiChartPaletteSemanticCriticalLight3',
				'sapUiChartPaletteSemanticGoodLight2',
				'sapUiChartPaletteSemanticGood'
			]
		}
	};

	return Palette;
});