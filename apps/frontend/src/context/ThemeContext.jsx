import ocean_wp from "../assets/pieces/ocean/wp.png";
import ocean_wn from "../assets/pieces/ocean/wn.png";
import ocean_wb from "../assets/pieces/ocean/wb.png";
import ocean_wq from "../assets/pieces/ocean/wq.png";
import ocean_wk from "../assets/pieces/ocean/wk.png";
import ocean_wr from "../assets/pieces/ocean/wr.png";
import ocean_bp from "../assets/pieces/ocean/bp.png";
import ocean_bn from "../assets/pieces/ocean/bn.png";
import ocean_bb from "../assets/pieces/ocean/bb.png";
import ocean_bq from "../assets/pieces/ocean/bq.png";
import ocean_bk from "../assets/pieces/ocean/bk.png";
import ocean_br from "../assets/pieces/ocean/br.png";

import neo_wp from "../assets/pieces/neo/wp.png";
import neo_wn from "../assets/pieces/neo/wn.png";
import neo_wb from "../assets/pieces/neo/wb.png";
import neo_wq from "../assets/pieces/neo/wq.png";
import neo_wk from "../assets/pieces/neo/wk.png";
import neo_wr from "../assets/pieces/neo/wr.png";
import neo_bp from "../assets/pieces/neo/bp.png";
import neo_bn from "../assets/pieces/neo/bn.png";
import neo_bb from "../assets/pieces/neo/bb.png";
import neo_bq from "../assets/pieces/neo/bq.png";
import neo_bk from "../assets/pieces/neo/bk.png";
import neo_br from "../assets/pieces/neo/br.png";

import default_move     from "../assets/sounds/default/move.mp3";
import default_capture  from "../assets/sounds/default/capture.mp3";
import default_promotion  from "../assets/sounds/default/promotion.mp3";
import default_check    from "../assets/sounds/default/check.mp3";
import default_castle   from "../assets/sounds/default/castle.mp3";

import { createContext, useContext, useState } from "react";
export const ThemeContext = createContext();
export const useThemeContext = () => useContext(ThemeContext);

const pieceImgsSource = {
  neo: {
    p: neo_bp,
    n: neo_bn,
    b: neo_bb,
    q: neo_bq,
    k: neo_bk,
    r: neo_br,
    P: neo_wp,
    N: neo_wn,
    B: neo_wb,
    Q: neo_wq,
    K: neo_wk,
    R: neo_wr,
  },
  ocean: {
    p: ocean_bp,
    n: ocean_bn,
    b: ocean_bb,
    q: ocean_bq,
    k: ocean_bk,
    r: ocean_br,
    P: ocean_wp,
    N: ocean_wn,
    B: ocean_wb,
    Q: ocean_wq,
    K: ocean_wk,
    R: ocean_wr,
  },
};

const boardColorsSource = {
  green: {
    dark:  "bg-[#739552]",
    light: "bg-[#ebecd0]",
    darkRed:  "bg-[#d16a50]",
    lightRed: "bg-[#ec7e6a]",
    availableEmptySquare: "bg-black/20",
    availableNonEmptySquare: "border-red-500/60",
  }
}

const soundSource = {
  default: {
    move: default_move,
    capture: default_capture,
    promotion: default_promotion,
    check: default_check,
    castle: default_castle,
  }
}

let ThemeContextProvider = ({ children }) => {

  // TODO: add theme to local storage

  let themeOptions = {
    pieces: Object.keys(pieceImgsSource),
    board: Object.keys(boardColorsSource),
    sound: Object.keys(soundSource),
  }
  let [themeName, setThemeNames] = useState({
    pieces: themeOptions.pieces[0],
    board: themeOptions.board[0],
    sound: themeOptions.sound[0],
  });
  let [theme, setThemes] = useState({
    pieces: pieceImgsSource[themeName.pieces],
    board: boardColorsSource[themeName.board],
    sound: soundSource[themeName.sound],
  });

  return (
    <ThemeContext.Provider value={{
      themeOptions, themeName, setThemeNames, theme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;
