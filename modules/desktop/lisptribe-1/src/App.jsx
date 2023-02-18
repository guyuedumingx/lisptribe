// import { React, Component } from "react";
import "./App.css";
import { useState } from "react";
import CommandField from "./components/CommandField";
import ResultBox from "./components/ResultBox";
import { useRef } from "react";
import { useEffect } from "react";

function App() {
    const commandFieldRef = useRef()
    const  [resultList, setResultList] = useState(
      [
        {
          title: "(global-symbols)",
          content: "(throw nil? true? false? number? string? symbol symbol? keyword \
                  keyword? fn? macro? pr-str str prn println readline read-string \
                  slurp time-ms list list? vector vector? hash-map \
                  map? assoc dissoc get contains? keys vals sequential? cons concat \
                  vec nth first rest empty? count apply map conj seq with-meta meta \
                  atom atom? deref reset! swap! eval *ARGV* *host-language* not \
                  load-file cond send-msg server repl global-symbols-string exit \
                  load-lib type use use-to-mal pr-list dotimes bind-env new-env env-find \
                  env-find-str env-get env-set car cdr global remote global-symbols *desktop*)"
        }
      ]);
    const [question, setquestion] = useState("")
    
    const getQuestion = (val) => {
      setquestion(val)
      // console.log('val',val);
    }

    useEffect(()=>{
      // console.log('question',question);
      // 拿question return的value setResultList
    },[question])
    
    return (
      <div class="show-area">  
        <CommandField getQuestion={getQuestion} />
        {resultList.map(item =>
          (<ResultBox title={item.title} content={item.content}/>)
        )}
      </div>
    );
}

export default App;
