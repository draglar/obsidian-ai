#!/bin/sh

if ! command -v pyinstaller &> /dev/null; then
    echo "pyinstaller is not installed. Installing..."
    pip install pyinstaller
fi

if [ ! -f app.py ]; then
    echo "app.py not found. Please make sure the file exists."
    exit 1
fi

echo "Installing Flask and other dependencies..."
pip install flask

echo "Building the exe file..."
pyinstaller --onefile app.py

if [ -f dist/app ]; then
    echo "Executable file created successfully."
    cp dist/app app
else
    echo "Failed to create the exe file."
fi

