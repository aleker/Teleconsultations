
Run server
==========
#### Installing the node-modules
This server needs npm and Node.js installed. You can find the installation guides [here](https://docs.npmjs.com/getting-started/what-is-npm)
Clone or download and extract the project and go to the main project directory. Then install the dependencies 
by typing in
```
npm install
```
#### Setting the ssl connection
Our server runs on https. To use it, you should first generate the certificates. Run the following commands 
in the main project directory.
```
cd scripts
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```

In order to run the server, go to command line and change directory:

```
cd scripts
```

And type:

```
node server.js 
```

You can change the server parameters in a config file. See the "Configuration file" section below. 

Run client application
======================
In order to run client application, go to web browser and type:

```
https://0.0.0.0:8080/index.html
```

where '0.0.0.0' is server's host and '8080' is the port server is listening on (both configurated in the config file)



Python server
============
Installing dependencies (Python 2.7)
```
cd python
pip2 install -r requirements.txt
```

You should generate yet another certificate. 
Run the command
```
cd python
openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes
```
Running the server
```
cd python
python2 simpleserver.py
```

Configuration file
=================
There are several parameters that can be set using the config file:
* main server IP address
* main server port
* python server port
* msgHistoryMaxSize - sets the maximum number of text messages sent to each new participant as a chat history
* imgHistoryMaxSize - sets the maximum number of images sent to each new participant as an image history
* colors - an array that sets the color codes used as chat colors for new users. When there are more participants 
than available colors, each next one gets a default, black color.
* pathForSavedImages - sets the path to the directory, where images are saved by server.

