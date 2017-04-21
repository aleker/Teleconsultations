from PIL import Image
import PIL.ImageOps
import base64
from io import BytesIO
from cStringIO import StringIO
from base64 import decodestring


class ImageHandler():
    def __init__(self, processing_type, img_data):
        self.processing_type = processing_type
        index = img_data.find(",")
        self.image_data = img_data[index + 1:]
        self.image_type = img_data[:index]

        # Saving image to file
        with open("original_image.png", "wb") as f:
            f.write(decodestring(self.image_data))

    def encode_to_base64(self, processed_image):
        output = StringIO()
        processed_image.save(output, format='JPEG')
        im_data = output.getvalue()
        data_url = self.image_type + ',' + base64.b64encode(im_data)
        return data_url

    def process_image(self):
        # Decode to PIL Image
        im = Image.open(BytesIO(base64.b64decode(self.image_data)))
        processed_image = None

        if self.processing_type == 'invert':
            print("inverting the colors")
            # Check if image is RGBA Transparent. If yes, then convert to RGB first, invert and back to RGBA
            if im.mode == 'RGBA':
                r, g, b, a = im.split()
                rgb_image = Image.merge('RGB', (r, g, b))
                inverted_image = PIL.ImageOps.invert(rgb_image)
                r2, g2, b2 = inverted_image.split()
                processed_image = Image.merge('RGBA', (r2, g2, b2, a))
            else:
                processed_image = PIL.ImageOps.invert(im)

        return self.encode_to_base64(processed_image=processed_image)
