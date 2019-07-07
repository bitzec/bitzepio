// @flow
import electron from 'electron'; // eslint-disable-line
import React, { type ComponentType, Component } from 'react';

import { LoadingScreen } from './loading-screen';

import rpc from '../../services/api';

type Props = {};

type State = {
  isRunning: boolean,
  progress: number,
  message: string,
};

/* eslint-disable max-len */
export const withDaemonStatusCheck = <PassedProps: {}>(
  WrappedComponent: ComponentType<PassedProps>,
): ComponentType<$Diff<PassedProps, Props>> => class extends Component<PassedProps, State> {
    timer: ?IntervalID = null;

    hasDaemonError: boolean = false;

    state = {
      isRunning: false,
      progress: 0,
      message: 'BitzecStarting',
    };

    componentDidMount() {
      this.runTest();
      this.timer = setInterval(this.runTest, 2000);

      electron.ipcRenderer.on('bitzec-daemon-status', (event: empty, message: Object) => {
        this.hasDaemonError = message.error;

        if (message.error) {
          clearInterval(this.timer);
        }

        this.setState({
          message: message.status,
          ...(message.error ? { progress: 0, isRunning: false } : {}),
        });
      });
    }

    componentWillUnmount() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    runTest = () => {
      if (this.hasDaemonError) return;

      rpc
        .getinfo()
        .then((response) => {
          if (this.hasDaemonError) return;

          if (response) {
            setTimeout(() => {
              this.setState(() => ({ isRunning: true }));
            }, 500);
            this.setState(() => ({ progress: 100 }));

            if (this.timer) {
              clearInterval(this.timer);
              this.timer = null;
            }
          }
        })
        .catch((error) => {
          if (this.hasDaemonError) return;

          const statusMessage = error.message === 'Something went wrong' ? 'Bitzec Starting' : error.message;

          const isRpcOff = Math.trunc(error.statusCode / 100) === 5;

          this.setState({
            message: statusMessage,
          });

          // if rpc is off (500) we have probably started the daemon process and are waiting it to boot up
          if (isRpcOff) {
            this.setState((state) => {
              const newProgress = state.progress > 70 ? state.progress + 2.5 : state.progress + 5;
              return { progress: newProgress > 95 ? 95 : newProgress, message: statusMessage };
            });
          }
        });
    };

    render() {
      const { isRunning, progress, message } = this.state;

      if (isRunning) {
        return <WrappedComponent {...this.props} {...this.state} />;
      }

      return <LoadingScreen progress={progress} message={message} />;
    }
  };
