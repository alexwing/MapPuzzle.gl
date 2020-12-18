import React, { Component } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Fireworks from '../lib/Fireworks';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Alert from 'react-bootstrap/Alert';

import {  getUrl, getTexTime, getTime  } from '../lib/Utils.js';
import './YouWin.css';
import { FacebookShareButton, FacebookIcon,
    EmailShareButton, EmailIcon,
    TwitterShareButton, TwitterIcon,
    LinkedinShareButton, LinkedinIcon,
    WhatsappShareButton, WhatsappIcon,
    TelegramShareButton, TelegramIcon
} from "react-share";


export default class YouWin extends Component {

    constructor(props) {
        super(props)
        this.state = {
            show: true,
        }
    }

    render() {
        const { onResetGame } = this.props;
        let handleClose = () => {
            this.setState({
                show: false
            });
        }
        let url =  "http://"+ getUrl() +"/?map="+this.props.path;
        let quote = "I completed the puzzle game of the "+this.props.name+", in "+getTexTime()+", with "+this.props.fails+" failures out of "+this.props.founds.length+" pieces found."
        let hashtag = "education,cartography,puzzle,countries"
        let title = "MapPuzzle.xyz - Puzzle game based in maps"
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
                                    {getTime()}
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
                    <Row>
                        <Col lg={12} className="share">
                            <h4>Share your score</h4>
                            <EmailShareButton url={url} subject={title}  body={quote} >
                                <EmailIcon size={48} round={true} />
                            </EmailShareButton>                             
                            <FacebookShareButton url={url} quote={quote} hashtag={hashtag}>
                                <FacebookIcon size={48} round={true} />
                            </FacebookShareButton>
                            <TwitterShareButton url={url} title ={quote} hashtags={hashtag.split(',')}>
                                <TwitterIcon size={48} round={true} />
                            </TwitterShareButton>
                            <LinkedinShareButton url={url} title={title + " - " + this.props.name}  summary={quote} source ={title}>
                                <LinkedinIcon size={48} round={true} />
                            </LinkedinShareButton>                            
                            <WhatsappShareButton url={url} title={quote} >
                                <WhatsappIcon size={48} round={true} />
                            </WhatsappShareButton>                            
                            <TelegramShareButton url={url} title={quote} >
                                <TelegramIcon size={48} round={true} />
                            </TelegramShareButton>                            
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