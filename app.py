from flask import Flask, render_template, request, redirect, url_for
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('in.html')

@app.route('/checkout', methods=['POST'])
def checkout():
    return render_template('checkout.html')

if __name__ == '__main__':
    app.run(debug=True)
