import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Accordion from 'react-bootstrap/Accordion';
import Table from 'react-bootstrap/Table';
import {  ST_ExtentToVieport } from '../components/Utils.js';



class ToolsPanel extends Component {
  render() {

    const { height, name, pieceSelected, info, pieces,onPieceSelected } = this.props;

    const Legend = (
      <Table striped bordered hover size="sm" className="legend">
        <tbody>
          <tr >
            <td className="table-info" align="left" >{info !== null ? info.properties.name : <i style={{ color: "gray" }}>Mouse info here</i>}</td>
            <td>
            <svg height="50px" width="50px" viewBox="min-x min-y width height">
            {info !== null ?  <path d={info.properties.poly} stroke="black" strokeWidth="1" fill="red" /> : <i style={{ color: "gray" }}>Mouse info here</i>}
              </svg>

            </td>
          </tr>
          {pieces.map(c => (
            <tr key={c.cartodb_id} onClick={onPieceSelected} id={c.name} className={c.name === pieceSelected ? "table-primary" : ""}>
              <td width="80%">{c.formal_en ? c.formal_en :  c.name }</td>
              <td width="20%" align="right">
              <svg height="24px" width="80px" viewBox={ST_ExtentToVieport(c.box)} preserveAspectRatio="slice" style={{ border: "1px solid lightgray", boxShadow: "rgba(0, 0, 0, 0.15) 1px 1px 2px"}}>
                <path d={c.poly} stroke="black" strokeWidth="0" fill="gray" />
              </svg>
              </td>	
            </tr>
          ))}
        </tbody>
      </Table>
    
    );

    return <Accordion defaultActiveKey="0">
      <Card>
        <Accordion.Toggle as={Card.Header} eventKey="0" >
          {name}
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="0">
          <Card.Body style={{ overflowY: "auto", maxHeight: (height - 140) + "px" }}>
            <Form>
              {Legend}
            </Form>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  }

}

export default ToolsPanel;