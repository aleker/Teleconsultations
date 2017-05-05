#openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes
from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler
import json
import ssl
from urlparse import parse_qs
from image_processing import ImageHandler
import argparse
import cgi


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(s):
        print("Received config GET")
        s.send_response(200)
        s.send_header("Content-type", "text/html")
        s.end_headers()
        s.wfile.write("<html><head><title>Site check.</title></head>")
        s.wfile.write("<body><p>This is a test.</p>")
        s.wfile.write("<p>You accessed path: %s</p>" % s.path)
        s.wfile.write("</body></html>")

    def do_POST(self):
        print("\n----- Request Start ----->\n")

        # Parsing the POST here
        length = int(self.headers['Content-Length'])
        post_data = parse_qs(self.rfile.read(length).encode('utf-8'))

        # Getting the type of processing to be applied on our image and the image
        processing_type = post_data['type[]']
        img_data = post_data['image'][0]
        brightness = post_data['brightness'][0]

        print("New image! Filters: " + str(processing_type))

        image_handler = ImageHandler(img_data=img_data, processing_type=processing_type, brightness=brightness)
        # Getting the processed image
        data_url = image_handler.process_image()
        print("<----- Request End -----\n")

        # Send the response
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Expose-Headers", "Access-Control-Allow-Origin")
        self.send_header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
        self.end_headers()
        json_response = json.dumps({'type': 'python_response', 'data': data_url})
        self.wfile.write(json_response)


def parse():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '-c',
        '--config',
        default='../tsconfig.json'
    )
    return parser.parse_args()

if __name__ == "__main__":
    args = parse()
    # Parse config file
    with open(args.config, 'r') as f:
        config = json.load(f)
    address = config['server']['ip']
    port = int(config['python_port'])
    print('Server running on: ' + address + " port: " + str(port))
    server = HTTPServer((address, port), RequestHandler)
    server.socket = ssl.wrap_socket (server.socket, certfile='server.pem', server_side=True)
    server.serve_forever()
