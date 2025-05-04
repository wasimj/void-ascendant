# Void Ascendant Test Suite

This directory contains automated tests for the Void Ascendant game.

## Setup

1. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Install at least one of these browsers:
   - Chrome (recommended)
   - Firefox
   - Edge
   - Safari (macOS only)

   The test will automatically try each browser until it finds one that works.

## Running Tests

### Start the local server

Before running tests, start a local web server in the project root directory:

```bash
cd /home/wasim/Code/Games/AWE/Void\ Ascendant
python -m http.server 8000
```

### Run the starvation test

Open a new terminal window and run:

```bash
cd /home/wasim/Code/Games/AWE/Void\ Ascendant/tests
python -m unittest test_starvation.py
```

## Test Descriptions

### Starvation Test (`test_starvation.py`)

This test simulates a complete game flow that leads to starvation:

1. Start the game
2. Go to settings
3. Reset the game
4. Start game
5. Enter name "Mr Tester" 
6. Wait until starvation occurs
7. Verify "You starve to death" message appears
8. Verify "Days Survived: 4" is displayed

This test ensures the game's core hunger mechanic and game-over conditions work properly.

## Troubleshooting

If the test fails, check the following:

- Ensure the local server is running on port 8000
- Check that you have at least one supported browser installed
- The test tries Chrome, Firefox, Edge, and Safari (in that order) automatically
- If timing seems off, you may need to adjust the sleep durations in the test script
- Run with `-v` flag for verbose output: `python -m unittest -v test_starvation.py`

## Manual Setup (if auto-detection fails)

If you're having issues with browser detection, you can manually modify the test to use a specific browser:

1. Edit `test_starvation.py`
2. Modify the `setUp()` method to use just your preferred browser
3. Make sure you have the corresponding webdriver installed:

   - **Chrome**: Install ChromeDriver matching your Chrome version
     ```bash
     # Example for Ubuntu/Debian
     sudo apt install chromium-chromedriver
     ```

   - **Firefox**: Install GeckoDriver
     ```bash
     # Example for Ubuntu/Debian
     sudo apt install firefox-geckodriver
     ```
