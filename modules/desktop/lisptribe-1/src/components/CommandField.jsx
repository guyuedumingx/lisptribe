import React, { useState } from 'react';
import { useRef } from 'react';
import { Input, Cell, Button, Card } from 'react-vant';
import "./CommandField.css";

export default (props) => {
    const textAreaRef = useRef(null)
    const setQuestionFn = props.getQuestion

    return (
        <Cell className='input-box'>
            <Input 
                ref={textAreaRef}
                className='inputarea'
                placeholder="输入命令"
                onChange={()=>{
                    const val = textAreaRef.current.nativeElement.value
                    setQuestionFn(val)
                }}
                autoSize />

            <div class="butbox">
            <Button className='runbut' size="small" type="primary">Run</Button>
            </div> 
        </Cell>
    )
}