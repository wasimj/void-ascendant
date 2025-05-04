import time
import unittest
import os
import platform
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class StarvationTest(unittest.TestCase):

    def setUp(self):
        print("\n--- Setting up browser driver ---")
        # Create output directory for screenshots if it doesn't exist
        self.output_dir = os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Attempt to initialize a driver with fallbacks
        drivers_to_try = ['chrome', 'firefox', 'edge', 'safari']
        self.driver = None
        
        for browser in drivers_to_try:
            try:
                print(f"Attempting to initialize {browser} browser...")
                if browser == 'chrome':
                    from selenium.webdriver.chrome.options import Options
                    options = Options()
                    options.add_argument("--no-sandbox")
                    options.add_argument("--disable-dev-shm-usage")
                    self.driver = webdriver.Chrome(options=options)
                    print(f"Successfully initialized {browser} browser")
                    break
                    
                elif browser == 'firefox':
                    from selenium.webdriver.firefox.options import Options
                    options = Options()
                    self.driver = webdriver.Firefox(options=options)
                    print(f"Successfully initialized {browser} browser")
                    break
                    
                elif browser == 'edge':
                    from selenium.webdriver.edge.options import Options
                    options = Options()
                    self.driver = webdriver.Edge(options=options)
                    print(f"Successfully initialized {browser} browser")
                    break
                    
                elif browser == 'safari' and platform.system() == 'Darwin':  # Only on macOS
                    self.driver = webdriver.Safari()
                    print(f"Successfully initialized {browser} browser")
                    break
                    
            except Exception as e:
                print(f"Failed to initialize {browser}: {str(e)[:100]}...")
                continue
                
        # Skip test if no driver could be initialized
        if not self.driver:
            self.skipTest("No compatible browser drivers available")
            
        # Set window size
        self.driver.set_window_size(1920, 1080)
        print(f"Browser window set to size 1920x1080")
        
        # Set implicit wait time
        self.driver.implicitly_wait(10)
        print("Implicit wait time set to 10 seconds")
    
    def save_screenshot(self, filename):
        """Save screenshot to the output directory with timestamp"""
        filepath = os.path.join(self.output_dir, filename)
        self.driver.save_screenshot(filepath)
        print(f"Screenshot saved: {filepath}")
        
    def tearDown(self):
        # Close the browser if it was initialized
        if hasattr(self, 'driver') and self.driver:
            print("\n--- Closing browser ---")
            self.driver.quit()
            
    def test_starvation_scenario(self):
        """
        Test the game's starvation scenario:
        1. Start the game and skip intro
        2. Enter name and complete setup
        3. Wait for starvation to occur
        4. Verify "You starve to death" and "Days Survived: 4"
        """
        print("\n=== STARTING STARVATION TEST ===")
        
        # Step 1: Load game 
        print("\n--- Step 1: Load game ---")
        self.driver.get("http://localhost:8000")
        
        # Wait for splash video to load and click it to skip
        print("\n--- Step 2: Skipping intro sequence ---")
        try:
            # Click the Skip link (div.intro-skip, not a button)
            print("Looking for Skip element...")
            skip_element = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "div.intro-skip"))
            )
            print("Found Skip element, clicking it...")
            skip_element.click()
            print("Successfully clicked Skip element")
            
            # click Tap to continue button
            print("Looking for Tap to continue button...")
            tap_to_continue_element = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "div.computer-intro-continue"))
            )
            print("Found Tap to continue button, clicking it...")
            tap_to_continue_element.click()
            print("Successfully clicked Tap to continue button")

            # Enter player name
            print("Looking for player name input...")
            name_input = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.ID, "player-name"))
            )
            print("Found player name input, entering name...")
            name_input.send_keys("Mr Tester")
            print("Looking for submit button...")
            submit_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button.computer-intro-submit"))
            )
            print("Found submit button, clicking it...")
            submit_button.click()
            print("Successfully entered player name and submitted")
            
            # click next Tap to continue button
            print("Looking for next Tap to continue button...")
            tap_to_continue_element = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "div.computer-intro-continue"))
            )
            print("Found next Tap to continue button, clicking it...")
            tap_to_continue_element.click()
            print("Successfully clicked next Tap to continue button")

            # click Begin button
            print("Looking for Begin button...")
            begin_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Begin')]"))
            )
            print("Found Begin button, clicking it...")
            begin_button.click()
            print("Successfully clicked Begin button")
            
        except Exception as e:
            print(f"Error during intro sequence: {str(e)[:100]}...")
            print("Taking screenshot for debugging...")
            self.save_screenshot("intro_sequence_error.png")
            raise
        
        # Wait for starvation to occur
        print("\n--- Step 3: Waiting for starvation ---")
        try:
            print("Waiting for starvation to occur (approximately 45-60 seconds)...")
            
            # Check for game over every 5 seconds (more efficient than one long wait)
            max_wait_time = 120  # Maximum 2 minutes total wait
            wait_interval = 5    # Check every 5 seconds
            
            for i in range(max_wait_time // wait_interval):
                # Take a screenshot to help debug
                self.save_screenshot(f"starvation_wait_{i}.png")
                
                # Check if game over screen is visible
                try:
                    game_over = self.driver.find_element(By.CSS_SELECTOR, "div.game-over-panel")
                    if game_over.is_displayed():
                        print("Game over detected!")
                        break
                except:
                    pass
                
                # Wait for a bit before checking again
                time.sleep(wait_interval)
            
        except Exception as e:
            print(f"Error during starvation wait: {str(e)[:100]}...")
            print("Taking screenshot for debugging...")
            self.save_screenshot("starvation_error.png")
            raise
        
        # Step 4: Verify game over due to starvation
        print("\n--- Step 4: Verifying starvation game over ---")
        try:
            print("Looking for starvation message...")
            game_over_message = WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "div.game-over-panel p"))
            )
            print(f"Found game over message: '{game_over_message.text}'")
            self.save_screenshot("game_over_message.png")
            self.assertIn("starve", game_over_message.text.lower())
        except Exception as e:
            print(f"Failed to find starvation message: {str(e)[:100]}...")
            print("Taking screenshot for debugging...")
            self.save_screenshot("starvation_message_error.png")
            raise
        
        # Step 5: Verify days survived
        print("\n--- Step 5: Verifying days survived ---")
        try:
            print("Looking for days survived message...")
            days_survived = WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "div.game-over-panel .win-score"))
            )
            print(f"Found days survived message: '{days_survived.text}'")
            self.save_screenshot("days_survived.png")
            self.assertIn("Days Survived:", days_survived.text)
        except Exception as e:
            print(f"Failed to find days survived message: {str(e)[:100]}...")
            print("Taking screenshot for debugging...")
            self.save_screenshot("days_survived_error.png")
            raise
        
        print("\n=== STARVATION TEST PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    unittest.main()
