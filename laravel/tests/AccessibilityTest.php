<?php

namespace {
    if (!function_exists('env')) {
        function env($key, $default = null) {
            return $default;
        }
    }
}

namespace Tests {
    class AccessibilityTest
    {
        public static function run(): int
        {
            $passed = 0;
            $failed = 0;

            echo "\n========================================\n";
            echo "Universal Rich Text Editor — Phase 23 Accessibility & Mobile Tests\n";
            echo "========================================\n\n";

            $config = require __DIR__ . '/../config/editor.php';

            // Test 1: Config contains accessibility definition
            if (isset($config['accessibility']) && is_array($config['accessibility'])) {
                echo "✓ Test 1: Configuration contains 'accessibility' definition\n";
                $passed++;
            } else {
                echo "✗ Test 1: Missing 'accessibility' configuration array\n";
                $failed++;
            }

            // Test 2: Accessibility defaults to enabled with polite announcer
            if (
                ($config['accessibility']['enabled'] ?? false) === true &&
                ($config['accessibility']['announcer_politeness'] ?? '') === 'polite'
            ) {
                echo "✓ Test 2: Accessibility defaults enabled with aria-live 'polite' politeness\n";
                $passed++;
            } else {
                echo "✗ Test 2: Accessibility defaults mismatch\n";
                $failed++;
            }

            // Test 3: Visible focus rings & keyboard navigation active
            if (
                ($config['accessibility']['visible_focus_rings'] ?? false) === true &&
                ($config['accessibility']['keyboard_navigation'] ?? false) === true
            ) {
                echo "✓ Test 3: Visible focus rings (:focus-visible) and roving tabindex keyboard navigation enabled\n";
                $passed++;
            } else {
                echo "✗ Test 3: Focus rings or keyboard navigation disabled\n";
                $failed++;
            }

            // Test 4: Default editor screen reader label
            if (!empty($config['accessibility']['editor_label'])) {
                echo "✓ Test 4: Accessible screen reader editor label configured: '{$config['accessibility']['editor_label']}'\n";
                $passed++;
            } else {
                echo "✗ Test 4: Empty accessible editor label\n";
                $failed++;
            }

            // Test 5: Config contains mobile definition
            if (isset($config['mobile']) && is_array($config['mobile'])) {
                echo "✓ Test 5: Configuration contains 'mobile' definition\n";
                $passed++;
            } else {
                echo "✗ Test 5: Missing 'mobile' configuration array\n";
                $failed++;
            }

            // Test 6: Mobile minimum touch target conforms to WCAG 2.5.5 (>= 44px)
            $touchTargetMin = $config['mobile']['touch_target_min_size'] ?? 0;
            if ($touchTargetMin >= 44) {
                echo "✓ Test 6: Mobile touch target conforms to WCAG 2.5.5 min size ({$touchTargetMin}px >= 44px)\n";
                $passed++;
            } else {
                echo "✗ Test 6: Touch target size {$touchTargetMin}px is below WCAG 2.5.5 requirement (44px)\n";
                $failed++;
            }

            // Test 7: Mobile breakpoints configured (mobile: 768px, tablet: 1024px)
            $breakpoints = $config['mobile']['breakpoints'] ?? [];
            if (($breakpoints['mobile'] ?? 0) === 768 && ($breakpoints['tablet'] ?? 0) === 1024) {
                echo "✓ Test 7: Mobile responsive breakpoints properly set (mobile: 768px, tablet: 1024px)\n";
                $passed++;
            } else {
                echo "✗ Test 7: Mobile responsive breakpoints invalid\n";
                $failed++;
            }

            // Test 8: Eliminate mobile tap delay enabled
            if (($config['mobile']['eliminate_tap_delay'] ?? false) === true) {
                echo "✓ Test 8: Eliminate 300ms mobile tap delay enabled (touch-action: manipulation)\n";
                $passed++;
            } else {
                echo "✗ Test 8: Tap delay elimination not active\n";
                $failed++;
            }

            echo "\n----------------------------------------\n";
            echo "Phase 23 Laravel Accessibility & Mobile Tests Completed: {$passed} Passed, {$failed} Failed.\n";
            echo "----------------------------------------\n";

            return $failed === 0 ? 0 : 1;
        }
    }

    exit(AccessibilityTest::run());
}
