import React, { Component } from 'react';
import { secondsToTime } from '../lib/Utils.js';
import GameTime from '../lib/GameTime.js'
import { setCookie } from "react-simple-cookie-store"

export default class Timer extends Component {

    constructor(props) {
        super(props)
        this.timer = 0;
        this.startTimer = this.startTimer.bind(this);
        this.countDown = this.countDown.bind(this);
        this.state = {
            time: {
                "h": 0,
                "m": 0,
                "s": 0
            },
        }
        GameTime.seconds = 0;
    }
    startTimer() {
        this.timer = setInterval(this.countDown, 1000);
    }

    componentDidMount() {
        this.startTimer();
    }

    componentWillUnmount() {
        clearInterval(this.countDown);
    }

    countDown() {
        if (!this.props.YouWin && !this.props.loading) {
            GameTime.seconds++;
            if (GameTime.seconds % 5 === 0) {
                setCookie("seconds" + this.props.puzzleSelected, GameTime.seconds, 2);
            }
        }
        this.setState({
            time: secondsToTime(GameTime.seconds),
        });
    }

    getTime() {
        if (this.state.time.h > 0) {
            return <ul id="hours"><li> <b>{this.state.time.h} </b>Hours </li><li><b>{this.state.time.m}</b> Minutes </li><li><b>{this.state.time.s}</b> Seconds</li></ul>;
        } else if (this.state.time.m > 0) {
            return <ul id="minutes"><li><b>{this.state.time.m}</b> Minutes </li><li><b>{this.state.time.s}</b> Seconds</li></ul>;
        } else if (this.state.time.s > 0) {
            return <ul id="seconds"><li><b>{this.state.time.s}</b> Seconds</li></ul>;
        } else {
            return <ul></ul>;
        }
    }
    render() {
        return <div className="timer">
            {this.getTime()}
        </div>;
    }

}