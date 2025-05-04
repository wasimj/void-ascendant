#!/usr/bin/env python
import unittest
import os
import time
import sys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from test_utils import VoidAscendantBaseTest

class StarvationTest(VoidAscendantBaseTest):
    """
    Test case to verify that the starvation game over screen works correctly.
    This test:
    1. Loads the game
    2. Skips the intro sequence
    3. Waits for the organics to reach zero
    4. Verifies the game over screen appears with correct message
    5. Verifies the days survived count is displayed
    """

    def test_starvation(self):
        """Test that the starvation game over works correctly."""
        print("\n=== STARTING STARVATION TEST ===\n")
        
        # Step 1: Load the game
        print("\n--- Step 1: Load game ---")
        self.load_game()
        
        # Step 2: Skip the intro sequence
        print("\n--- Step 2: Skipping intro sequence ---")
        self.skip_intro_sequence()
        
        # Step 3: Wait for starvation
        print("\n--- Step 3: Waiting for starvation ---")
        print("Waiting for starvation to occur (approximately 45-60 seconds)...")
        
        # Take screenshots while waiting for starvation
        for i in range(3):
            time.sleep(15)  # Wait 15 seconds between screenshots
            self.save_screenshot(f"starvation_wait_{i}.png")
            
            # Check if game over has appeared yet
            game_over_elements = self.driver.find_elements(By.XPATH, "//h2[text()='Game Over']")
            if len(game_over_elements) > 0:
                print("Game over detected!")
                break
        
        # Step 4: Verify the starvation game over message
        print("\n--- Step 4: Verifying starvation game over ---")
        game_over_reason = self.wait_for_element("div.game-over-panel p")
        self.assertIn("starve", game_over_reason.text.lower())
        print(f"Found game over message: '{game_over_reason.text}'")
        self.save_screenshot("game_over_message.png")
        
        # Step 5: Verify the days survived count
        print("\n--- Step 5: Verifying days survived ---")
        days_survived_element = self.wait_for_element("div.game-over-panel .win-score")
        self.assertIn("Days Survived:", days_survived_element.text)
        print(f"Found days survived message: '{days_survived_element.text}'")
        self.save_screenshot("days_survived.png")
        
        print("\n=== STARVATION TEST PASSED SUCCESSFULLY! ===")


if __name__ == "__main__":
    unittest.main()
