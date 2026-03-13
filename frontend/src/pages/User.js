import React from "react";
import {useState, useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router";
import authSlice from "../store/slices/auth";
import axiosService from "../utils/axios";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import {RootState} from "../store";

import {Chart as ChartJS, registerables} from 'chart.js';
import {Line} from "react-chartjs-2";

import {
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    FormGroup,
    Input,
    Label,
} from "reactstrap";

ChartJS.register(...registerables);

export default function User() {
    const [nextAuth, setNextAuth] = useState(new Date());
    const [myUser, setMyUser] = useState(null);
    const [myUserId, setMyUserId] = useState(null);
    const [isLoged, setIsLoged] = useState(false);

    const [displayModal, setDisplayModal] = useState(false);
    const [modalAction, setModalAction] = useState("add");
    const [modalError, setModalError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const [endpointName, setEndpointName] = useState("devices");
    const [error, setError] = useState(null);
    const [fetchData, setFetchData] = useState(false);

    const [wsUserClient, setWsUserClient] = useState(null);
    const [wsDeviceClient, setWsDeviceClient] = useState(null);
    const [wsUserMessages, setWsUserMessages] = useState([]);
    const [deviceMessages, setDeviceMessages] = useState([]);
    const [myMessage, setMyMessage] = useState("");

    const [devices, setDevices] = useState([])
    const [data, setData] = useState(null)

    const auth = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const history = useNavigate();

    const refresh = () => {
        setFetchData(!fetchData);
    }

    useEffect(() => {
        let currentDate = new Date();
        currentDate.setMinutes(currentDate.getMinutes() + 1);
        setNextAuth(currentDate);

        if (auth == null || auth.account == null || !auth.account || !auth.account?.id || auth.account.role !== "user")
            history("/login");

        const account = auth.account;
        const userId = account?.id;
        setMyUserId(userId);

        axiosService
            .get('http://localhost:8001/api/user/' + userId)
            .then((res) => {
                console.log("Got user: " + JSON.stringify(res.data));
                setMyUser(res.data);
                if (res.data.role !== "user")
                    history("/login");

                setError(null);
                setIsLoged(true);
                refresh();
            })
            .catch((err) => {
                console.error("Error when fething user: " + JSON.stringify(err.response));
                setError(JSON.stringify(err.response));
                setIsLoged(false);
            });

        if (wsUserClient == null) {
            const _client = new W3CWebSocket('ws://localhost:8001/ws/' + userId + "/");
            _client.onmessage = (message) => {
                const dataFromServer = JSON.parse(message.data);
                console.log(dataFromServer);

                if (dataFromServer && "text" in dataFromServer) {
                    const data = dataFromServer.text;
                    setWsUserMessages((wsUserMessages) => [...wsUserMessages, {from: data.from, to: data.to, msg: data.msg}]);
                }
            };
            _client.onopen = function (event) {
                console.log('connected users');
            };
            setWsUserClient(_client);
        }

        if (wsDeviceClient == null) {
            const _client = new W3CWebSocket('ws://localhost:8002/ws/' + userId + "/");
            _client.onmessage = (message) => {
                const dataFromServer = JSON.parse(message.data);
                if (dataFromServer) {
                    let m = [];
                    console.log(dataFromServer)
                    deviceMessages.map(item => { m.push(item); })
                    m.push({ msg: dataFromServer.text, timestamp: new Date()})
                    setDeviceMessages(m);
                }
            };
            _client.onopen = function (event) {
                console.log('connected devices');
            };
            setWsDeviceClient(_client);
        }
    }, []);

    useEffect(() => {
        if (myUser) {
            axiosService
                .get('http://localhost:8002/api/device/')
                .then((res) => {
                    setDevices(res.data);
                    setError(null);
                })
                .catch((err) => {
                    console.error("Error when fetching semds: " + JSON.stringify(err.response));
                    setDevices([]);
                    setError(JSON.stringify(err.response));
                });
        }
    }, [fetchData]);

    function sendMessage() {
        wsUserClient.send(JSON.stringify({
            type: "chat_message",
            text: {
                from: myUserId,
                to: "admin",
                msg: myMessage
            }
        }))

        setWsUserMessages((wsUserMessages) => [...wsUserMessages, {from: myUserId, to: "admin", msg: myMessage}]);
        setMyMessage("");
    }

    const handleLogout = () => {
        dispatch(authSlice.actions.setLogout());
        history("/login");
    };

    const handleSubmit = (item) => {

        switch (modalAction) {
            case "add":
                axiosService
                    .post(`http://localhost:8002/api/devicedata/`, item)
                    .then((res) => {
                        refresh();
                        setDisplayModal(!displayModal);
                        setSelectedItem(null);
                    })
                    .catch((err) => {
                        console.error("Error when fetching assignments: " + JSON.stringify(err.response.data));
                        setModalError(JSON.stringify(err.response.data));
                    });
                return;
        }
    };

    const addUsage = (src_item) => {
        let item = {
            id_device: src_item.id, energy_consumption: Math.floor(Math.random() * 100), timestamp: new Date()
        };

        setData(null);
        setSelectedItem(item);
        setModalAction("add");
        setModalError(null);
        setDisplayModal(!displayModal);
    };

    let work_item = null;

    const showUsage = (src_item) => {
        let d = new Date()
        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        let day = d.getDate();
        let item = {
            id_device: src_item.id, timestamp: year + "-" + month + "-" + day
        };
        setData(null);
        work_item = null;
        setSelectedItem(item);
        work_item = item;
        submitDate();
        setModalAction("show");
        setModalError(null);
        setDisplayModal(!displayModal);
    }

    const submitDate = () => {
        if (work_item) {
            let data = null;
            let id = null;
            if (work_item) {
                data = work_item.timestamp.split("-");
                id = work_item.id_device;
            }

            let year = data[0];
            let month = data[1];
            let day = data[2];

            axiosService
                .get('http://localhost:8002/api/devicedata/' + id + "/" + year + "/" + month + "/" + day)
                .then((res) => {
                    console.log("Received devicess " + JSON.stringify(res.data));
                    const data1 = {
                        labels: res.data.map((d) => {
                            let dd = d.timestamp.split("T")[1].split(".")[0];
                            return dd;
                        }), datasets: [{
                            label: "Consumption in " + year + "/" + month + "/" + day,
                            data: res.data.map((d) => d.energy_consumption),
                            borderColor: "blue",
                        }]
                    };
                    setData(data1);
                    console.log("CHART DATA: " + JSON.stringify(data1));
                    setModalError(null);
                })
                .catch((err) => {
                    if (err.response) {
                        console.error("Error when fetching data: " + JSON.stringify(err.response));
                        setData(null);
                        setModalError(JSON.stringify(err.response));
                    } else {
                        console.error("Error when fetching data: " + err.toString());
                        setData(null);
                        setModalError(err.toString());
                    }
                });
        }
    }

    const handleMessageChange = (e) => {
        let {name, value} = e.target;
        setMyMessage(value);
    };

    const renderWsMessages = () => {
        let refTime = new Date();
        refTime.setSeconds(refTime.getSeconds() - 10);

        return deviceMessages.map(item => {
            if (item.timestamp < refTime)
                return null;
            return (
                <li key={item.msg} className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="mr-2">
                        {item.msg}
                    </span>
                    <span className="mr-2">
                        {item.timestamp.toString()}
                    </span>
                </li>
            );
        });
    };

    const renderItems = () => {
        if (endpointName === "devices")
            return devices.map(item => {
                return (
                    <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="mr-2"> {item.description} </span>
                        <span className="mr-2"> {item.address} </span>
                        <span className="mr-2"> {item.maxhec} </span>
                        <span>
                            <button className="btn btn-secondary mr-2" onClick={() => showUsage(item)}>
                                Usage
                            </button>
                            <button className="btn btn-danger" onClick={() => addUsage(item)}>
                                Log
                            </button>
                        </span>
                    </li>);
            });
        else {
            return wsUserMessages.map(item => {
                return (
                    <li className="list-group-item d-flex justify-content-between align-items-center" >
                        <span className={ item.from === myUserId ? "mr-2 btn-danger" : "mr-2" } >
                            {item.msg}
                        </span>
                    </li>
                );
            });
        }
    };


    const handleChange = (e) => {
        let {name, value} = e.target;

        if (e.target.type === "checkbox")
            value = e.target.checked;

        const updatedActiveItem = {...selectedItem, [name]: value};
        setSelectedItem(updatedActiveItem);

        if (modalAction === "show")
            work_item = updatedActiveItem;

        submitDate();
    };

    const renderTabList = () => {
        return (
            <div className="nav nav-tabs">
                <span
                    onClick={() => setEndpointName("devices")}
                    className={endpointName === "devices" ? "nav-link active" : "nav-link"}
                >
                  Devices
                </span>
                <span
                    onClick={() => setEndpointName("messenger")}
                    className={endpointName === "messenger" ? "nav-link active" : "nav-link"}
                >
                  Messenger
                </span>
            </div>
        );
    };
    const renderModal = () => {
        if (displayModal) {
            switch (modalAction) {
                case 'add':
                    return (<Modal isOpen={true}>
                        <ModalHeader>Device: {selectedItem.id_device}</ModalHeader>
                        {modalError ? <ModalHeader>Error: {modalError}</ModalHeader> : null}
                        <ModalBody>
                            <Form>
                                <Input
                                    type="text"
                                    id="title"
                                    name="id"
                                    value={selectedItem.id_device}
                                    placeholder="Enter id."
                                    readOnly
                                    hidden
                                />
                                <FormGroup>
                                    <Label for="description">Energy Consumption</Label>
                                    <Input
                                        type="number"
                                        id="description"
                                        name="energy_consumption"
                                        value={selectedItem.energy_consumption}
                                        onChange={handleChange}
                                        placeholder="Enter description."
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <Label for="description">Timestamp</Label>
                                    <Input
                                        type="datetime"
                                        id="address"
                                        name="timestamp"
                                        value={selectedItem.timestamp}
                                        onChange={handleChange}
                                        placeholder="Enter address."
                                    />
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="fail"
                                onClick={() => {
                                    setDisplayModal(false);
                                    setModalError(null);
                                    setSelectedItem(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="success"
                                onClick={() => handleSubmit(selectedItem)}
                            >
                                Save
                            </Button>
                        </ModalFooter>
                    </Modal>);
                case 'show':
                    return (<Modal isOpen={true}>
                        <ModalHeader>Device: {selectedItem.id_device}</ModalHeader>
                        {modalError ? <ModalHeader>Error: {modalError}</ModalHeader> : null}
                        <ModalBody>
                            <Form>
                                <Input
                                    type="text"
                                    id="title"
                                    name="id"
                                    value={selectedItem.id_device}
                                    placeholder="Enter id."
                                    readOnly
                                    hidden
                                />
                                <FormGroup>
                                    <Label for="description">Choose date</Label>
                                    <Input
                                        type="date"
                                        id="description"
                                        name="timestamp"
                                        value={selectedItem.timestamp}
                                        onChange={handleChange}
                                        placeholder="Enter data."
                                    />
                                </FormGroup>

                                {data && data.labels.length > 0 ? (<FormGroup>
                                        <Line data={data}/>
                                    </FormGroup>) : (<FormGroup>
                                        <Label for="title">No data to show.</Label>
                                    </FormGroup>)}
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="fail"
                                onClick={() => {
                                    setData(null);
                                    setDisplayModal(false);
                                    setModalError(null);
                                    setSelectedItem(null);
                                }}
                            >
                                Cancel
                            </Button>
                        </ModalFooter>
                    </Modal>);
            }
        }
    }

    return isLoged ? (<main className="container">
        <h1 className="text-white text-uppercase text-center my-4">SD app</h1>
        <div className="row text-center">
            <button
                onClick={handleLogout}
                className="btn btn-primary"
            >
                Logout
            </button>
        </div>
        {error ? <div className="row text-center">Error: {error}</div> : null}
        <div className="row">
            <div className="col-md-6 col-sm-10 mx-auto p-0">
                <div className="card p-3">
                     {renderTabList()}
                    <ul className="list-group list-group-flush border-top-0">
                        {endpointName === "devices"? renderWsMessages(): (
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                <textarea
                                    id="message-text-id"
                                    name="message-text-name"
                                    value={myMessage}
                                    placeholder="Enter message."
                                    onChange={handleMessageChange}
                                />
                                <button className="btn btn-secondary mr-2" onClick={() => sendMessage()}>Send message</button>
                            </li>
                        )}
                    </ul>
                    <ul className="list-group list-group-flush border-top-0">
                        {renderItems()}
                    </ul>
                </div>
            </div>
        </div>
        {renderModal()}
    </main>) : (<main className="container">
        <h1 className="text-white text-uppercase text-center my-4">SD app</h1>
        {error ? <div className="row text-center">Error: {error}</div> :
            <div className="row text-center">Logging...</div>}

    </main>);
}
