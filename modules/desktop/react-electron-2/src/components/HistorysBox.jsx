import React from 'react';
import { Card } from 'react-vant';
import "./HistorysBox.css";

export default (props) => {
    return (
        <Card className='result-box'>
            <Card.Header className='result-header'>{ props.title }</Card.Header>
            <Card.Body>{ props.content }</Card.Body>
        </Card>
    )
}