# Fifth Grade Coding Teaching Tool
** This is a level progression based game that was created for fifth graders to learn the basics of coding. We wanted to make it fun and engaging.

# Set Up
** Technologies Used
- HTML for the basic structure of the pages
- CSS for page styling
- JavaScript for game functionality
- Firebase was used for storing login information as well as user's level progression, and storing unlocked rewards

** Getting the Code
- Download the zip file from GitHub to extract it locally, or clone the repository
- git clone https://github.com
- cd project3
- code .

  ** For Firebase access, you'll need to contact the development team

# Build and Run
** Run Locally
- Using the zip file:
- un-zip the file
- Open preferred code editor
- Open the project folder in code editor
- Run the program, it should open a new internet browser

- Using the git clone command
- Run the command line
- Change directory : cd project3
- Run this line: code .
- The project will open in code editor
- Run the project

** Verify Setup
  **The program should be working correctly if
- The hompage loads correctly
- User is able to play the levels
- User is able to collect the rewards after finishing a level

# Understand the Code
** Main Components

** index.html
** Responsibilities
- Displays the homepage
- Loads the JavaScript files

** Firebase
** Resposibilities
- User autentication
- Saving user progress
- Saving unlocked rewards

** Level Logic
** Responsibilities
- Tracking level completion
- Unlocking new levels

** Reward System
** Responsibilities
- Awarding animals
- Saving unlocked animals
- Displaying animals to the home page

** Main Flow
- Student logs on to the website
- Student completes a level
- The JavaScript listens for the level to be complete
- The prize button appears
- A new animal is unlocked
- Animal is then saved to the database and home page
- Once the home page reloads, the new animal is displayed
- The next level is unlocked 

# Test a Change
**To run a manual test
- Launch the program locally
- Create a test account
- Complete a level
- Confirm the level has been marked as finished
- Confirm the animal has bee unlocked
- Refresh the home page
- Confirm the unlocked animal appears on th ehome page

** We are currently working on implementing automated testing
** Project currently relies heavily on manual testing

# Troubleshoot
** Firebase Troubles

Possible problems:
- Login doesn't work
- Rewards aren't saving

** Check:
- Double check login information
- Make sure the project is active

** Current Limitations:
- User progress cannot be saved if Firebase is unavailable
- The game is desinged for second grade aged kids, currently supports only the current levels and rewards
