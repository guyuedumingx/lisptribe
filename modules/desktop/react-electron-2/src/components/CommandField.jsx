import React, { useState } from 'react';
import { Input, Cell, Button } from 'react-vant';
import "./CommandField.css";

export default (props) => {
    const [req, setReq] = useState('');

    return (
        <Cell className='input-box'>
            <Input 
                className='inputarea'
                placeholder="输入命令"
                onChange={(e)=>{setReq(e)}}
                autoSize />

            <div className="butbox">
                <Button 
                    className='runbut' 
                    size="small" 
                    onClick={()=> {
                        props.addReq(req);
                        // setReq("");
                    }}
                    type="primary">Run</Button>
            </div> 
        </Cell>
    )
}