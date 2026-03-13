import React from "react";
import { useState, useEffect } from "react";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router";
import authSlice from "../store/slices/auth";
import axiosService from "../utils/axios";
import sha256 from 'crypto-js/sha256'
import { w3cwebsocket as W3CWebSocket } from "websocket";
import {RootState} from "../store";

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

const { v4: uuidv4 } = require('uuid');

export default function Admin() {
    const [nextAuth, setNextAuth] = useState(new Date());
    const [myUser, setMyUser] = useState(null);
    const [myUserId, setMyUserId] = useState(null);
    const [isLoged, setIsLoged] = useState(false);

    const [displayModal, setDisplayModal] = useState(false);
    const [modalAction, setModalAction] = useState("add");
    const [modalError, setModalError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const [backendLocation, setBackendLocation] = useState("localhost:8001");
    const [endpointName, setEndpointName] = useState("user");
    const [error, setError] = useState(null);
    const [fetchData, setFetchData] = useState(false);
    const [changedPassword, setChangedPassword] = useState(false);

    const [wsUsersClient, setWsUsersClient] = useState(null);
    const [myMessage, setMyMessage] = useState("");
    const [chatingWith, setChatingWith] = useState(null);
    const [usersMessages, setUsersMessages] = useState([]);
    const [usersChating, setUsersChating] = useState([]);

    const [users, setUsers] = useState([])
    const [devices, setDevices] = useState([])
    const [assignments, setAssignments] = useState([])

    const auth = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const history = useNavigate();

    const refresh = () => {
        setFetchData(!fetchData);
    }

    useEffect(() => {
        if (auth == null || auth.account == null || !auth.account || !auth.account?.id || auth.account.role !== "admin")
            history("/login");

        const account = auth.account;
        const userId = account?.id;
        setMyUserId(userId);

        axiosService
            .get('http://localhost:8001/api/user/' + userId)
            .then((res) => {
                console.log("Got user: " + JSON.stringify(res.data));
                setMyUser(res.data);
                if (res.data.role !== "admin") {
                    history("/login");
                }
                setError(null);
                setIsLoged(true);
                refresh();
            })
            .catch((err) => {
                console.error("Error when fething user: " + JSON.stringify(err.response));
                setError(JSON.stringify(err.response));
                setIsLoged(false);
            });

        if (wsUsersClient == null) {
            const _client = new W3CWebSocket('ws://localhost:8001/ws/' + userId + "/");
            _client.onmessage = (message) => {
                const dataFromServer = JSON.parse(message.data);
                if (dataFromServer && "text" in dataFromServer) {
                    console.log(dataFromServer);

                    const data = dataFromServer["text"];
                    setUsersMessages((wsUserMessages) => [...wsUserMessages, {to: "admin", from: data["from"], msg: data["msg"]}]);
                    setUsersChating((chatMessages) => chatMessages.includes(data["from"]) ? [...chatMessages]: [...chatMessages, data["from"]]);
                }
            };
            _client.onopen = function (event) {
                console.log('connected users');
            };
            setWsUsersClient(_client);
        }
    }, [])

    useEffect(() => {
        if (myUser) {
            axiosService
                .get('http://localhost:8001/api/user/')
                .then((res) => {
                    setUsers(res.data);
                    setError(null);
                })
                .catch((err) => {
                    setUsers([]);
                    setError(JSON.stringify(err.response));
                });
            axiosService
                .get('http://localhost:8002/api/device/')
                .then((res) => {
                    setDevices(res.data);
                    setError(null);
                })
                .catch((err) => {
                    console.error("Error when fetching devices: " + JSON.stringify(err.response));
                    setDevices([]);
                    setError(JSON.stringify(err.response));
                });
            axiosService
                .get('http://localhost:8002/api/assignment/')
                .then((res) => {
                    setAssignments(res.data);
                    setError(null);
                })
                .catch((err) => {
                    console.error("Error when fetching assignments: " + JSON.stringify(err.response.data));
                    setAssignments([]);
                    setError(JSON.stringify(err.response));
                });
        }
    }, [fetchData]);

    function sendMessage() {
        wsUsersClient.send(JSON.stringify({
            type: "chat_message",
            text: {
                from: myUserId,
                to: chatingWith,
                msg: myMessage
            }
        }));

        setUsersMessages((wsUserMessages) => [...wsUserMessages, {to: chatingWith, from: "admin", msg : myMessage}]);
        setMyMessage("");
    }

    const handleMessageChange = (e) => {
        let {name, value} = e.target;
        setMyMessage(value);
    };

    const handleLogout = () => {
        dispatch(authSlice.actions.setLogout());
        history("/login");
    };

    const handleSubmit = (item) => {
        console.log(item);
        if ("password" in item && changedPassword)
            item["password"] = sha256(item.password).toString();

        switch (modalAction) {
            case "add":
                axiosService
                    .post(`http://${backendLocation}/api/${endpointName}/`, item)
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

            case "update":
                axiosService
                    .put(`http://${backendLocation}/api/${endpointName}/${item.id}`, item)
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

    const handleDelete = (item) => {
        axiosService
            .delete(`http://${backendLocation}/api/${endpointName}/${item.id}`)
            .then((res) => refresh())
            .catch((err) => {
                console.error("Error when deleting: " + JSON.stringify(err.response.data));
                setError(JSON.stringify(err.response.data));
            });
    };

    const createItem = () => {
        let item = {};
        let endpoint = null;
        switch (endpointName) {
            case 'user':
                item = {id: uuidv4(), username: null, password: null, role: "user", updated: new Date(), created: new Date()};
                endpoint = "localhost:8001";
                break;
            case 'device':
                item = {id: uuidv4(), description: null, address: null, maxhec: 0.0}
                endpoint = "localhost:8002";
                break;
            case 'assignment':
                item = {id: uuidv4(), id_user: null, id_device: null}
                endpoint = "localhost:8002";
                break;
        }

        setSelectedItem(item);
        setBackendLocation(endpoint);
        setModalAction("add");
        setModalError(null);
        setDisplayModal(!displayModal);
    };

    const editItem = (item) => {
        setSelectedItem(item);
        setModalAction("update")
        setModalError(null);
        setDisplayModal(!displayModal);
        setChangedPassword(false);

        switch (endpointName) {
            case 'user':
                setBackendLocation("localhost:8001");
                break;
            case 'device':
                setBackendLocation("localhost:8002");
                break;
            case 'assignment':
                setBackendLocation("localhost:8002");
                break;
        }
    };

    const showMessages = (item) => {
        setChatingWith(item);
        setModalAction("messenger")
        setModalError(null);
        setDisplayModal(!displayModal);
    };

    const renderItems = () => {
        let items = [];
        switch (endpointName) {
            case 'user':
                items = users;
                break;
            case 'device':
                items = devices;
                break;
            case 'assignment':
                items = assignments;
                break;
            case 'messenger': {
                items = usersChating;
            }
        }

        return items.map(item => {
            switch (endpointName) {
                case 'user':
                    return (
                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="mr-2" title={item.username}>
                                {item.username}
                            </span>
                            <span className="mr-2" title={item.role}>
                                {item.role}
                            </span>
                            <span>
                              <button className="btn btn-secondary mr-2" onClick={() => editItem(item)}>
                                Edit
                              </button>
                              <button className="btn btn-danger" onClick={() => handleDelete(item)}>
                                Delete
                              </button>
                            </span>
                        </li>);

                case 'device':
                    return (
                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="mr-2">
                                {item.address}
                            </span>
                            <span className="mr-2">
                                {item.description}
                            </span>
                            <span className="mr-2">
                                {item.maxhec}
                            </span>
                            <span>
                              <button className="btn btn-secondary mr-2" onClick={() => editItem(item)}>
                                Edit
                              </button>
                              <button className="btn btn-danger" onClick={() => handleDelete(item)}>
                                Delete
                              </button>
                            </span>
                        </li>);
                case 'assignment':
                    return (
                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="mr-2" title={item.id_user}>
                                { users.filter(x => x.id === item.id_user).length > 0? users.filter(x => x.id === item.id_user)[0].username: "No username" }
                            </span>
                            <span className="mr-2" title={item.id_device}>
                                { devices.filter(x => x.id === item.id_device).length > 0?  devices.filter(x => x.id === item.id_device)[0].description: "No description"}
                            </span>
                            <span>
                              <button className="btn btn-secondary mr-2" onClick={() => editItem(item)}>
                                Edit
                              </button>
                              <button className="btn btn-danger" onClick={() => handleDelete(item)}>
                                Delete
                              </button>
                            </span>
                        </li>);
                case 'messenger':
                    return (
                        <li className="list-group-item d-flex justify-content-between align-items-center" >
                            <span className="mr-2">
                                {users.filter(x => x.id === item).length > 0? users.filter(x => x.id === item)[0].username: "No username"}
                            </span>
                            <span>
                                <button
                                  className="btn btn-secondary mr-2"
                                  onClick={() => showMessages(item)}
                                 >
                                    Show chat
                                </button>
                        </span>
                        </li>);
            }
            return null;
        });
    };

    const renderTabList = () => {
        return (
            <div className="nav nav-tabs">
                <span
                    onClick={() => {setEndpointName("user"); setBackendLocation("users");}}
                    className={endpointName === "user" ? "nav-link active" : "nav-link"}
                >
                  Users
                </span>
                <span
                    onClick={() => {setEndpointName("device"); setBackendLocation("devices");}}
                    className={endpointName === "device" ? "nav-link active" : "nav-link"}
                >
                  Devices
                </span>
                <span
                    onClick={() => {setEndpointName("assignment"); setBackendLocation("devices");}}
                    className={endpointName === "assignment" ? "nav-link active" : "nav-link"}
                >
                  Assignments
                </span>
                <span
                    onClick={() => {setEndpointName("messenger"); setBackendLocation("users");}}
                    className={endpointName === "messenger" ? "nav-link active" : "nav-link"}
                >
                  Messenger
                </span>
            </div>
        );
    };

    const handleChange = (e) => {
        let { name, value } = e.target;

        if (e.target.type === "checkbox")
            value = e.target.checked;

        if (name === "password")
            setChangedPassword(true);

        const updatedActiveItem = { ...selectedItem, [name]: value };
        setSelectedItem(updatedActiveItem);
    };

    const renderClientMessages = (_client) => {
        return usersMessages.filter(item => (item.from === "admin" && item.to === _client) || (item.to === "admin" && item.from === _client)).map(item => {
            return (<li className="list-group-item d-flex justify-content-between align-items-center">
                     <span className={item.from==="admin" ? "mr-2 btn-danger" : "mr-2"}>
                        {item.msg}
                    </span>
            </li>);
        });
    }

    const renderModal = () => {
        if (displayModal) {
            switch (endpointName) {
                case 'user':
                    return (
                        <Modal isOpen={true}>
                            <ModalHeader>User: {selectedItem.username}</ModalHeader>
                            {modalError?<ModalHeader>Error: {modalError}</ModalHeader>:null}
                            <ModalBody>
                                <Form>
                                    <Input
                                        type="text"
                                        id="id_user"
                                        name="id"
                                        value={selectedItem.id}
                                        placeholder="Enter userid."
                                        readOnly
                                        hidden
                                    />
                                    <FormGroup>
                                        <Label for="username">Name</Label>
                                        <Input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={selectedItem.username}
                                            placeholder="Enter username."
                                            onChange={handleChange}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="password">Password</Label>
                                        <Input
                                            type="password"
                                            id="password"
                                            name="password"
                                            defaultValue=""
                                            onChange={handleChange}
                                            placeholder="Enter password."
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="role">Role</Label>
                                        <select
                                            type="text"
                                            id="role"
                                            name="role"
                                            defaultValue={selectedItem.role}
                                            placeholder="Enter role."
                                            onChange={handleChange}
                                        >
                                            <option value="user">user</option>
                                            <option value="admin">admin</option>
                                        </select>
                                    </FormGroup>

                                </Form>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="fail" onClick={() => { setDisplayModal(false); setSelectedItem(null);}}>
                                    Cancel
                                </Button>
                                <Button color="success" onClick={() => handleSubmit(selectedItem)}>
                                    Save
                                </Button>
                            </ModalFooter>
                        </Modal>
                    );
                case 'device':
                    return (
                        <Modal isOpen={true}>
                            <ModalHeader>Device: {selectedItem.description}</ModalHeader>
                            {modalError?<ModalHeader>Error: {modalError}</ModalHeader>:null}
                            <ModalBody>
                                <Form>
                                    <Input
                                        type="text"
                                        id="title"
                                        name="id"
                                        value={selectedItem.id}
                                        placeholder="Enter id."
                                        readOnly
                                        hidden
                                    />
                                    <FormGroup>
                                        <Label for="description">Description</Label>
                                        <Input
                                            type="text"
                                            id="description"
                                            name="description"
                                            defaultValue={selectedItem.description}
                                            onChange={handleChange}
                                            placeholder="Enter description."
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="address">Address</Label>
                                        <Input
                                            type="text"
                                            id="address"
                                            name="address"
                                            defaultValue={selectedItem.address}
                                            onChange={handleChange}
                                            placeholder="Enter address."
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="maxhex">Max hourly energy consumption</Label>
                                        <Input
                                            type="number"
                                            id="maxhex"
                                            name="maxhec"
                                            defaultValue={selectedItem.maxhec}
                                            onChange={handleChange}
                                            placeholder="Enter max hourly consumption."
                                        />
                                    </FormGroup>
                                </Form>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="fail" onClick={() => { setDisplayModal(false); setModalError(null); setSelectedItem(null);}}>
                                    Cancel
                                </Button>
                                <Button color="success" onClick={() => handleSubmit(selectedItem)}>
                                    Save
                                </Button>
                            </ModalFooter>
                        </Modal>
                    );
                case 'assignment':
                    return (
                        <Modal isOpen={true}>
                            <ModalHeader>Assignment</ModalHeader>
                            {modalError?<ModalHeader>Error: {modalError.includes("already exists")? "Assignment already exists": modalError}</ModalHeader>:null}
                            <ModalBody>
                                <Form>
                                    <Input
                                        type="text"
                                        id="assignment-title"
                                        name="id"
                                        value={selectedItem.id}
                                        placeholder="Enter id."
                                        readOnly
                                        hidden
                                    />
                                    <FormGroup>
                                        <Label for="assignment-user">User</Label>
                                        <select
                                            type="text"
                                            id="is_device"
                                            name="id_user"
                                            placeholder="Enter user."
                                            value={selectedItem.id_user}
                                            onChange={handleChange}
                                        >
                                            {
                                                users.filter(user => user.role === "user").map(user => ( <option value={user.id}>{user.username}</option>))
                                            }
                                        </select>
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="assignment-description">Device</Label>
                                        <select
                                            type="text"
                                            id="id_device"
                                            name="id_device"
                                            placeholder="Enter device."
                                            value={selectedItem.id_device}
                                            onChange={handleChange}
                                        >
                                            {
                                                devices.map(device => ( <option value={device.id}>{device.description}</option>))
                                            }
                                        </select>
                                    </FormGroup>
                                </Form>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="fail" onClick={() => { setDisplayModal(false); setSelectedItem(null);}}>
                                    Cancel
                                </Button>
                                <Button color="success" onClick={() => handleSubmit(selectedItem)}>
                                    Save
                                </Button>
                            </ModalFooter>
                        </Modal>
                    );
                case 'messenger':
                    if (!chatingWith)
                        return null;

                    return (
                        <Modal isOpen={true}>
                            <ModalHeader>
                                <ul className="list-group list-group-flush border-top-0">
                                    <li className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>Messenger: { users.filter(x => x.id === chatingWith).length > 0? users.filter(x => x.id === chatingWith)[0].username: "No username" } </span>
                                    </li>
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
                                </ul>

                            </ModalHeader>
                            <ModalBody>
                                {renderClientMessages(chatingWith)}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="fail" onClick={() => { setDisplayModal(false); setChatingWith(null);}}>
                                    Cancel
                                </Button>
                            </ModalFooter>
                        </Modal>
                    );
            }
        }
    }

    return isLoged? (
        <main className="container">
            <h1 className="text-white text-uppercase text-center my-4">SD app</h1>
            <div className="row text-center">
                <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
            </div>
            {error? <div className="row text-center">Error: {error}</div>:null}
            <div className="row">
                <div className="col-md-6 col-sm-10 mx-auto p-0">
                    <div className="card p-3">
                        <div className="mb-4">
                            <button className="btn btn-primary" onClick={createItem}> Add </button>
                        </div>
                        {renderTabList()}
                        <ul className="list-group list-group-flush border-top-0">
                            {renderItems()}
                        </ul>
                    </div>
                </div>
            </div>
            {renderModal()}
        </main>
    ): (
        <main className="container">
            <h1 className="text-white text-uppercase text-center my-4">SD app</h1>
            {error?<div className="row text-center">Error: {error}</div>:<div className="row text-center">Logging...</div>}
        </main>
    );
}
