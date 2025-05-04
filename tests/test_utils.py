#!/usr/bin/env python
import unittest
import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class VoidAscendantBaseTest(unittest.TestCase):
    """
    Base test class for Void Ascendant game tests.
    Provides common utilities for setting up the browser,
    saving screenshots, and game interaction flows.
    """
    
    def setUp(self):
        """Set up the test environment with Chrome WebDriver."""
        print("\n--- Setting up browser driver ---")
        print("Initializing chrome browser...")
        
        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--window-size=1366,768")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        # Initialize the Chrome driver
        self.driver = webdriver.Chrome(options=chrome_options)
        print("Successfully initialized chrome browser")
        
        # Configure browser settings
        self.driver.set_window_size(1920, 1080)
        print("Browser window set to size 1920x1080")
        self.driver.implicitly_wait(10)
        print("Implicit wait time set to 10 seconds")
        
        # Create the output directory if it doesn't exist
        self.output_dir = os.path.join(os.path.dirname(__file__), "output")
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            
        # Base URL for tests
        self.base_url = "http://localhost:8000"

    def tearDown(self):
        """Clean up after test by closing the browser."""
        print("\n--- Closing browser ---")
        if hasattr(self, 'driver'):
            self.driver.quit()

    def save_screenshot(self, filename):
        """Save a screenshot to the output directory."""
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        screenshot_path = os.path.join(self.output_dir, filename)
        self.driver.save_screenshot(screenshot_path)
        print(f"Screenshot saved: {screenshot_path}")
        
    def load_game(self):
        """Load the game and return the driver."""
        self.driver.get(self.base_url)
        return self.driver

    def skip_intro_sequence(self):
        """Skip the intro video and computer intro sequence."""
        # Skip the intro video
        print("Looking for Skip element...")
        skip_element = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".intro-skip"))
        )
        print("Found Skip element, clicking it...")
        skip_element.click()
        print("Successfully clicked Skip element")
        
        # Continue through the computer intro
        print("Looking for Tap to continue button...")
        tap_to_continue_element = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".computer-intro-continue"))
        )
        print("Found Tap to continue button, clicking it...")
        tap_to_continue_element.click()
        print("Successfully clicked Tap to continue button")
        
        # Enter the player name
        print("Looking for player name input...")
        name_input = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "player-name"))
        )
        print("Found player name input, entering name...")
        name_input.send_keys("TestPlayer")
        
        # Submit the name
        print("Looking for submit button...")
        submit_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".computer-intro-submit"))
        )
        print("Found submit button, clicking it...")
        submit_button.click()
        print("Successfully entered player name and submitted")
        
        # Continue to the next step
        print("Looking for next Tap to continue button...")
        next_continue = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".computer-intro-continue"))
        )
        print("Found next Tap to continue button, clicking it...")
        next_continue.click()
        print("Successfully clicked next Tap to continue button")
        
        # Start the game
        print("Looking for Begin button...")
        begin_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Begin')]"))
        )
        print("Found Begin button, clicking it...")
        begin_button.click()
        print("Successfully clicked Begin button")
        
    def wait_for_element(self, selector, by=By.CSS_SELECTOR, timeout=10):
        """Wait for an element to be visible and return it."""
        return WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located((by, selector))
        )
    
    def wait_for_clickable(self, selector, by=By.CSS_SELECTOR, timeout=10):
        """Wait for an element to be clickable and return it."""
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable((by, selector))
        )
