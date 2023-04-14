import "./App.css";
import { useState } from "react";
import CommandField from "./components/CommandField";
import HistorysBox from "./components/HistorysBox";

function App() {
    const [historys, setHistorys] = useState([]);

    const addReq = async (req) => {
        const content = await window.ipcRenderer.invoke('send-req', req);
        const newReq = {title: req, content: content}
        setHistorys([newReq, ...historys].slice(0,50));
    }

    // window.ipcRenderer.on('reply-req', (event, arg) => {
    //     const newReq = {title: title, content: arg}
    //     setHistorys([newReq, ...historys].slice(0,50));
    // })

    return (
      <div className="show-area">  
        <CommandField addReq={addReq}/>
        {historys.map(item =>
          (<HistorysBox title={item.title} content={item.content}/>)
        )}
      </div>
    );
}

export default App;
