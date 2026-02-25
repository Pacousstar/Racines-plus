from PIL import Image

def make_transparent(input_path, output_path, tolerance=30):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # item is (R, G, B, A)
            # If the pixel is close to white, make it transparent
            if item[0] > 255 - tolerance and item[1] > 255 - tolerance and item[2] > 255 - tolerance:
                # white or almost white
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Success: {output_path}")
        
        # also create an ico file
        if output_path.endswith('.png'):
            ico_path = output_path.replace('.png', '.ico')
            img.save(ico_path, format='ICO', sizes=[(32,32), (64,64)])
            print(f"Success: {ico_path}")
            
    except Exception as e:
        print(f"Error: {e}")

# Process the logo
make_transparent("public/LOGO_Racines.png", "public/LOGO_Racines.png")
