from PIL import Image, ImageFilter, ImageEnhance
import PIL.ImageOps
import base64
from io import BytesIO
from cStringIO import StringIO
from base64 import decodestring


class ImageHandler():
    def __init__(self, processing_type, img_data, brightness):
        self.processing_types_set = set(processing_type)
        index = img_data.find(",")
        self.image_data = img_data[index + 1:]
        self.image_type = img_data[:index]
        self.brightness = float(brightness) / 100.0

    def encode_to_base64(self, processed_image):
        output = StringIO()
        processed_image.save(output, format='JPEG')
        im_data = output.getvalue()
        data_url = self.image_type + ',' + base64.b64encode(im_data)
        return data_url

    def process_image(self):
        # Decode to PIL Image
        im = Image.open(BytesIO(base64.b64decode(self.image_data)))
        # Handeling the RGBA images
        if im.mode == 'RGBA':
            print("RGBA!")
            r, g, b, a = im.split()
            processed_image = Image.merge('RGB', (r, g, b))
        else:
            processed_image = im
        
        print("Applying filters.")
        if 'invert' in self.processing_types_set:
            print("inverting the colors")
            processed_image = PIL.ImageOps.invert(processed_image)

        if 'sharpen' in self.processing_types_set:
            processed_image = processed_image.filter(ImageFilter.SHARPEN)

        if 'edges' in self.processing_types_set:
            processed_image = processed_image.filter(ImageFilter.FIND_EDGES)

        enhancer = ImageEnhance.Brightness(processed_image)
        processed_image = enhancer.enhance(self.brightness)

        return self.encode_to_base64(processed_image=processed_image)