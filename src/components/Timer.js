import React, { Component } from 'react';
import { secondsToTime } from './Utils.js';


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
            seconds: 0,
        }
    }
    startTimer() {

        this.timer = setInterval(this.countDown, 1000);
    }
    /*
    componentWillReceiveProps(props) {
        this.setState({ time: props.time, seconds: props.seconds })
    }*/
    componentDidMount() {
        this.startTimer();
    }

    countDown() {
        // console.log ("countDown timer")
        // add one second, set state so a re-render happens.
        let seconds = this.state.seconds + 1;
        this.setState({
            time: secondsToTime(seconds),
            seconds: seconds,
        });
    }

    getTime() {

        if (this.state.time.h > 0) {
            return <ul id="hours"><li> <b>{this.state.time.h} </b>Hours </li><li><b>{this.state.time.m}</b> Minutes </li><li><b>{this.state.time.s}</b> Seconds</li></ul>;
        } else if (this.state.time.m > 0) {
            return  <ul id="minutes"><li><b>{this.state.time.m}</b> Minutes </li><li><b>{this.state.time.s}</b> Seconds</li></ul>;
        } else if (this.state.time.s > 0) {
            return  <ul id="seconds"><li><b>{this.state.time.s}</b> Seconds</li></ul>;
        } else {
            return <ul></ul>;

        }


    }
    render() {
        const { } = this.props;

        return <div className="timer">
            {this.getTime()}
        </div>;
    }

}