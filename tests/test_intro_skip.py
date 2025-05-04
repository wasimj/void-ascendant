#!/usr/bin/env python3
import unittest
import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

class IntroSkipTest(unittest.TestCase):
    """Test class for verifying the intro skip functionality in Void Ascendant."""
    
    def setUp(self):
        """Set up the test environment."""
        print("\n=== SETTING UP INTRO SKIP TEST ===")
        
        # Create output directory if it doesn't exist
        os.makedirs("tests/output", exist_ok=True)
        
        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run headless by default (comment out for debugging)
        chrome_options.add_argument("--window-size=1366,768")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        
        # Initialize WebDriver
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            print("Chrome WebDriver initialized successfully")
        except WebDriverException as e:
            print(f"Failed to initialize Chrome WebDriver: {e}")
            raise
    
    def tearDown(self):
        """Clean up after the test."""
        if hasattr(self, 'driver'):
            self.driver.quit()
            
    def save_screenshot(self, name):
        """Save a screenshot to the output directory."""
        try:
            os.makedirs("tests/output", exist_ok=True)
            screenshot_path = f"tests/output/{name}.png"
            self.driver.save_screenshot(screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")
        except Exception as e:
            print(f"Failed to save screenshot: {e}")
    
    def test_intro_skip(self):
        """
        Test the ability to skip the game intro sequence.
        1. Load the game 
        2. Wait for the intro video to appear
        3. Click the skip button
        4. Verify the computer intro screen appears
        """
        print("\n=== STARTING INTRO SKIP TEST ===")
        
        # Step 1: Load game
        print("\n--- Step 1: Loading game ---")
        self.driver.get("http://localhost:8000")
        self.save_screenshot("01_game_loaded")
        
        # Step 2: Wait for and verify the intro video is shown
        print("\n--- Step 2: Verifying intro video is shown ---")
        try:
            intro_video = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.intro-video-overlay"))
            )
            print("Intro video is shown successfully")
            self.save_screenshot("02_intro_video_shown")
            self.assertTrue(intro_video.is_displayed(), "Intro video overlay should be visible")
        except TimeoutException:
            self.save_screenshot("02_error_no_intro_video")
            self.fail("Intro video did not appear within the timeout period")
        
        # Step 3: Click the Skip button
        print("\n--- Step 3: Clicking Skip button ---")
        try:
            print("Looking for Skip element...")
            skip_element = WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "div.intro-skip"))
            )
            print("Found Skip element, clicking it...")
            skip_element.click()
            print("Successfully clicked Skip element")
            self.save_screenshot("03_after_skip_clicked")
        except TimeoutException:
            self.save_screenshot("03_error_no_skip_button")
            self.fail("Skip button did not appear or was not clickable within the timeout period")
        
        # Step 4: Verify the computer intro screen appears
        print("\n--- Step 4: Verifying computer intro screen appears ---")
        try:
            computer_intro = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.computer-intro-overlay"))
            )
            print("Computer intro screen appeared successfully")
            self.save_screenshot("04_computer_intro_shown")
            self.assertTrue(computer_intro.is_displayed(), "Computer intro overlay should be visible")
        except TimeoutException:
            self.save_screenshot("04_error_no_computer_intro")
            self.fail("Computer intro screen did not appear after clicking skip")
        
        print("\n=== INTRO SKIP TEST COMPLETED SUCCESSFULLY ===")


if __name__ == "__main__":
    unittest.main()
