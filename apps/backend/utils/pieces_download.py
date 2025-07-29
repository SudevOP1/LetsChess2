from bs4 import BeautifulSoup
import requests, os, sys

location = "assets"
theme = "neo"

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8') # for emojis
    piece_links = [ 
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/wp.png", # white pawn
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/wn.png", # white knight
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/wr.png", # white rook
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/wb.png", # white bishop
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/wq.png", # white queen
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/wk.png", # white king

        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/bp.png", # black pawn
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/bn.png", # black knight
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/bb.png", # black rook
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/br.png", # black bishop
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/bq.png", # black queen
        f"https://images.chesscomfiles.com/chess-themes/pieces/{theme}/150/bk.png", # black king
    ]


    os.makedirs(location, exist_ok=True) # create dir if it does not exist

    def download_image(url, filename):
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(filename, 'wb') as file:
                for chunk in response.iter_content(1024):
                    file.write(chunk)
            print(f"✅ Saved  {filename}")
        else:
            print(f"❌ Failed {filename}")


    for url in piece_links:
        filename = os.path.join(location, url.split("/")[-1])
        download_image(url, filename)