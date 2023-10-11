from flask import Flask, request, jsonify, send_from_directory, render_template
# from flask_cors import CORS
import json
import nltk
import re
import hashlib
import os
import subprocess
import freeGPT
import asyncio
from PIL import Image
from io import BytesIO
from freeGPT import AsyncClient
from asyncio import run
import requests
from functions import *
import sys

app = Flask(__name__)
app.debug = True

def linux(command):
    output = subprocess.check_output(command,shell=True)
    output = output.decode('utf-8')
    variable = output.strip()
    return variable


def str_to_dict(json_str):
    try:
        data_dict = json.loads(json_str)
        return data_dict
    except json.JSONDecodeError:
        # Handle any JSON decoding errors here
        print("Invalid JSON string provided.")
        return {}

def extract_content(markdown):
    lines = markdown.split('\n')
    response_title = ""
    response_content = ""
    summary_title = ""
    summary_content = ""
    
    is_response = False
    is_summary = False
    
    for line in lines:
        if line.startswith("# response"):
            is_response = True
            is_summary = False
            response_title = line[10:].strip()
        elif line.startswith("# summary"):
            is_summary = True
            is_response = False
            summary_title = line[9:].strip()
        elif line.startswith("#"):
            continue
        else:
            if is_response:
                response_content +=f'{line}\n'
            elif is_summary:
                summary_content +=f'{line}\n'
    return {
        "response": response_content,
        "summary": summary_content
    }

def process_input(history):
    # Implement your logic to process the user input and generate a response here
    # You can access the entire history of user responses from the 'history' list
    # Perform any necessary processing or summarization of the history
    
    # Example: Concatenate all previous responses into a summary
    summary = ' '.join(history)
    
    response = f"This is your summary: {summary}"
    return response

# Start the main function
# run(main())

async def gptapi(model,prompt):
    print('running')
    try:
        print('trying')
        # resp = await getattr(freeGPT.Client, str(model)).Completion().create(prompt)
        resp = await AsyncClient.create_completion(model, prompt)
        return resp
    except Exception as e:
        print('trying badly')
        return f"🤖: {e}"

async def photoapi(generator,prompt,model,negative_prompt,path,basepath):

    try:
        # print('trying',generator)
        if generator == 'prodia':
            # print(f'{generator}_custom')
            resp = await AsyncClient.create_custom_generation(generator+'_custom', prompt,model,negative_prompt)
        else:
            resp = await AsyncClient.create_generation(generator, prompt)
        # resp = await getattr(freeGPT, "prodia").Generation().create(prompt)
        # print('generated')
        name ,filename = check_and_generate_hash(prompt)
        # print('hashed')
        pic = Image.open(BytesIO(resp))
        # print('picled')
        # return pic
        # print('picked')
        # image_path = f'../../../../{path}/{filename}'
        image_path = f'{basepath}/{path}/{filename}'
        # # text_path = f'../../../../gpt/{name}.md'
        # # base_name, extension = os.path.splitext(image_path)
        pic.save(image_path)
        # # save_text_file(text_path,prompt)
        # # print(f"🤖: Image shown -> fotos/{filename}")
        # print(f"🤖: Image shown -> {image_path}")
        return f'{path}/{filename}'
        
    except Exception as e:
        print('failed')
        return f"🤖: {e}"


@app.route('/api/text', methods=['POST'])
def text_api():
    text_types = ['gpt3', 'gpt4', 'invil']
    request_data = request.json

    model = request_data.get('model')
    input_text = request_data.get('prompt')

    try:
        context = request_data.get('context')
    except:
        context = ''

    try:
        summary = request_data.get('summary')
    except:
        summary = ''

    if 'prompt' in request_data and request_data['model'] in text_types:
        # Perform some action based on the text type and the provided context, input, model, and summary
        # Your code logic here
        # resp = await getattr(freeGPT, model).Completion().create(quest)

        quest = input_text
        resp = quest
        response = asyncio.run(gptapi(model, quest))
        # resp = await gptapi(model, quest)
        # response = f'{resp}'
        return jsonify({'status': 'successfull','response':response})
    else:
        return jsonify({'error': 'Invalid text type'})

@app.route('/api/image', methods=['POST'])
def image_api():
    image_types = ['prodia', 'pollinations']
    request_data = request.json

    generator = request_data.get('generator')
    prompt = request_data.get('prompt')
    model  = request_data.get('model')
    negative_prompt  = request_data.get('negative_prompt')
    path  = request_data.get('path')
    basepath  = request_data.get('basepath')
    if 'prompt' in request_data and request_data['generator'] in image_types:
        # Process the uploaded file based on the provided context, input, model, and summary
        # Your code logic here
        response = asyncio.run(photoapi(generator, prompt,model,negative_prompt,path,basepath))
        # print(request_data)
        return jsonify({'status': 'successfull','response':f'![[{response}]]'})
    else:
        return jsonify({'error': 'Invalid image type'})

if __name__ == '__main__':
    port = sys.argv[1]
    app.run(port=port)
