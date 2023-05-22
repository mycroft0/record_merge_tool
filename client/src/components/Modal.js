import React, {useEffect, useState} from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import {baseURL, dataBase} from "../api/api"
import { Alert } from '@mui/material'
import ModalTable from "./ModalTable";


export default function MergeDialog({refresh, json, data, alphabet, cleanModalData, setSpinnerOn}) {
    const [show, setShow] = useState(false);

    const [mergeData, setMergeData] = useState([])

    const [successAlert, setSuccessAlert] = useState(false)
    const [recordQuantity, setRecordQuantity] = useState(false)
    const [mergeDataJson, setMergeDataJson] = useState([])
    const [idItem, setIdItem] = useState('')

    useEffect(() => {
        setMergeDataJson([])
        setIdItem('')
    }, [alphabet])

    const createModalData = (item, elem) => {
        if (elem === String(item.id)) {
            setMergeDataJson(element => [...element, item])
        }
    }

    const handleShow = () => {
        setShow(true);
        setMergeDataJson([])
        json.map(item => (
                data.map(elem => (
                        createModalData(item, elem)
                    )
                )
            )
        )
    }


    useEffect(() => {
        cleanModalData()
        setMergeData([])
    }, [alphabet])


    const handleClose = () => {
        refresh()
        cleanModalData()
        setMergeData([])
        setRecordQuantity(false)
        setShow(false)
    };


    const createPostRequest = (idItem) => {
        setMergeData([])


        if (idItem !== '') {

            setMergeData(elem => [...elem, {
                "id": idItem,
            }])

            const collectMergeData  = (item) => {
                if (item.id !== idItem) {
                    setMergeData(elem => [...elem, {
                        "id": item.id,
                    }])
                }
            }


            mergeDataJson.map((item) => (
                collectMergeData(item)
            ))

        }

    }

    const mergeRecords = () => {
        if (mergeData.length < 1) {
            setRecordQuantity(true)
        } else {
            const options = {
                method: 'POST',
                body: (JSON.stringify(mergeData)),
                headers: new Headers({
                    'content-type': 'application/json'
                })
            };
            fetch(`http://localhost:5008/postgres/list/merge`, options)
                .then(response => {
                        setSuccessAlert(true)
                    }
                )
                .catch(error => console.error('Error:', error))


            setShow(false)

            refresh()
            cleanModalData()


        }
    }


    return (
        <>
            <div className={'footer-style'}>
                <div>
                    <Button className={'merge-button'} variant="primary" onClick={handleShow}>
                        Merge Records
                    </Button>
                </div>
                <div>
                    {successAlert && <Alert variant="outlined" severity="success" style={{}} onClose={() => {
                        setSuccessAlert(false)
                    }}>Successfully updated!</Alert>}
                </div>


            </div>

            <Modal size='lg' show={show} onHide={handleClose}>

                <Modal.Header closeButton>
                    <Modal.Title>Merge records</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    {recordQuantity && <Alert severity="error">The list is empty!</Alert>}
                    <p>Please choose master record.</p>

                    <ModalTable createPostRequest={createPostRequest} idItem={idItem} data={mergeDataJson}/>


                    <Button variant="primary" onClick={mergeRecords}>Merge records</Button>
                </Modal.Body>
            </Modal>
        </>
    );
}

