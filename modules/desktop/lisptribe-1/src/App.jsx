import "./App.css";
import { useState } from "react";
import CommandField from "./components/CommandField";
import HistorysBox from "./components/HistorysBox";
import { run_command } from "./interpreter/stepA_mal.js";

function App() {
    const [historys, setHistorys] = useState([]);

    const addReq = (req) => {
        const newReq = {title: req, content: run_command(req)}
        setHistorys([newReq, ...historys].slice(0,50));
    }

    return (
      <div class="show-area">  
        <CommandField addReq={addReq}/>
        {historys.map(item =>
          (<HistorysBox title={item.title} content={item.content}/>)
        )}
      </div>
    );
}

export default App;
