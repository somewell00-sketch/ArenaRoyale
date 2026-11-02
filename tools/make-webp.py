# Light map textures for the new game: bg/<biome>.webp (colour) and bg/g/<biome>.webp (faded, for far areas)
import glob,os
from PIL import Image,ImageEnhance
for p in glob.glob('bg/*.png'):
    b=os.path.basename(p)[:-4];im=Image.open(p).convert('RGB').resize((640,640),Image.LANCZOS)
    im.save(f'bg/{b}.webp',quality=74,method=6)
    ImageEnhance.Color(im).enhance(.15).resize((384,384),Image.LANCZOS).save(f'bg/g/{b}.webp',quality=68,method=6)
