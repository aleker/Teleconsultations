Run server
==========
In order to run server, go to command line and change directory:

```
cd scripts
```

And type:

```
node server.js 0.0.0.0 1234
```

You can omit typing host and port name. By default server's host is localhost ('0.0.0.0') and runs on port '8080'. 

```
node server.js
```

Run client application
======================
In order to run client application, go to web browser and type:

```
0.0.0.0:8080/index.html
```

where '0.0.0.0' is server's host and '8080' is the port server is listening on.

Python server
============
Installing dependencies (Python 2.7)
```
cd python
pip install -r requirements.txt
```

Running the server
```
python2 simpleserver.py
```