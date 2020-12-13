import React, { Component } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Fireworks from '../lib/Fireworks';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Alert from 'react-bootstrap/Alert';
import GameTime from '../lib/GameTime.js'
import { secondsToTime } from '../lib/Utils.js';
import './YouWin.css';

export default class YouWin extends Component {

    constructor(props) {
        super(props)
        this.state = {
            show: true,
           
        }
    }
    getTime() {
        var time = secondsToTime(GameTime.seconds);
        if (time.h > 0) {
            return <span id="hours"> <b>{time.h} </b>Hours <b>{time.m}</b> Minutes <b>{time.s}</b> Seconds</span>;
        } else if (time.m > 0) {
            return <span id="minutes"><b>{time.m}</b> Minutes <b>{time.s}</b> Seconds</span>;
        } else if (time.s > 0) {
            return <span id="seconds"><b>{time.s}</b> Seconds</span>;
        } 
    }
    render() {
        const {  onResetGame } = this.props;
        let handleClose = () => {
            this.setState({
                show: false
            });
        }
     
        return <div>
            <Modal
                show={this.state.show}
                size="xl"
                aria-labelledby="contained-modal-title-vcenter"
                centered
                onHide={handleClose}
            >
                <Modal.Header>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Congratulations! You're done.
                </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="scorewin">
                        <Col xs={4} lg={4} >
                            <Alert variant="success">
                                <Alert.Heading>Founds:</Alert.Heading>
                                <hr />
                                <p className="mb-0">
                                    {this.props.founds.length}
                                </p>
                            </Alert>
                        </Col>
                        <Col xs={4} lg={4}>
                            <Alert variant="warning">
                                <Alert.Heading>Time:</Alert.Heading>
                                <hr />
                                <p className="mb-0">
                                {this.getTime()}
                                </p>
                            </Alert>
                        </Col>
                        <Col xs={4} lg={4}>
                            <Alert variant="danger">
                                <Alert.Heading>Fails:</Alert.Heading>
                                <hr />
                                <p className="mb-0">
                                    {this.props.fails}
                                </p>
                            </Alert>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={onResetGame}>New Game</Button>
                </Modal.Footer>
            </Modal>
            <Fireworks />
        </div>
    }

}