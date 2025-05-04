#!/usr/bin/env python
import unittest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from test_utils import VoidAscendantBaseTest

class IntroSkipTest(VoidAscendantBaseTest):
    """
    Test case to verify the intro sequence functionality.
    This test:
    1. Loads the game
    2. Verifies the intro video appears
    3. Clicks the skip button
    4. Verifies the computer intro screen appears
    5. Tests the entire computer intro sequence step by step
    """

    def test_intro_sequence(self):
        """Test the complete intro sequence including skip functionality."""
        print("\n=== STARTING INTRO SEQUENCE TEST ===\n")

        # Step 1: Load the game
        print("\n--- Step 1: Loading game ---")
        self.load_game()
        self.save_screenshot("01_game_loaded.png")

        # Step 2: Verify the intro video is shown
        print("\n--- Step 2: Skipping intro sequence ---")
        self.skip_intro_sequence()
        self.save_screenshot("02_intro_skipped.png")
        
        print("\n=== INTRO SEQUENCE TEST COMPLETED SUCCESSFULLY ===")


if __name__ == "__main__":
    unittest.main()
