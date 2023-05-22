import {useEffect, useMemo, useState} from "react";
import {Button} from "@mui/material";

import React from 'react';
import axios from "axios";
import {baseURL, dataBase} from "../api/api"
import Table from "./Table";
import {Alert} from "bootstrap";


const PaginationUI = ({setSpinner, setSpinnerOn}) => {
    const [alphabet, setAlphabet] = useState('Y');
    const [data, setData] = useState([]);
    const [dataTable, setDataTable] = useState([]);
    const [dbErrAlert, setDBErrAlert] = useState(false)
    const [pageChange, setPageChange] = useState(true)

    const [checkbox, setCheckbox] = useState(false)

    const onAlphabetClick = (e) => {
        setSpinnerOn()

        setPageChange(true)
        setDataTable([])
        setCheckbox(false)
        setAlphabet(e.target.value)
    }


    useEffect(() => {
        setCheckbox(true)
    }, [data])


    // Using useEffect to call the API once mounted and set the data
    useEffect(() => {
        setPageChange(false)

        let arrayPostData = [
            {
                letter: alphabet
            }
        ];

        (async () => {
            try {
                setDBErrAlert(false)
                setData([])
                const result = await axios.post(`http://localhost:5008/postgres/list/shipper`, arrayPostData);
                setData(result.data.data);
            } catch (err) {
                setDBErrAlert(true)
            }

        })();


    }, [pageChange]);

    const createTable = (elem) =>{
        if (elem.master_id === null || elem.master_id === "" || elem.is_master === 1) {
            if(String(elem.is_master) === '1'){
                elem.is_master = 'master'
            }if(String(elem.is_master) === '0'){
                elem.is_master = ''
            }
            setDataTable(item => [...item, elem])
        }
    }


    useEffect(() => {
        if (1) {
            setDataTable([])
             data.map(elem => (
                 createTable(elem)
            ))

            setTimeout(() => {
                setSpinner()
            }, 5000)
        }

    }, [data])

    const columns = useMemo(() => [

        {
            // first group - TV Show
            Header: "Shipper Name", // First group columns
            columns: [{
                accessor: "name"
            },]
        }, {
            // first group - TV Show
            Header: "Address", // First group columns
            columns: [{
                accessor: "address2"
            },]
        }, {
            // first group - TV Show
            Header: "Country name", // First group columns
            columns: [{
                accessor: "country_name"
            },]
        }, {
            // first group - TV Show
            Header: "id", // First group columns
            columns: [{
                accessor: "id"
            },]
        }, {
            // first group - TV Show
            Header: "master record", // First group columns
            columns: [{
                accessor: "is_master"
            },]
        }


    ], [])


    const prepareAlphabets = () => {
        let result = [];
        for (let i = 65; i < 91; i++) {
            result.push(
                <Button type="button" variant='primary' key={i} onClick={onAlphabetClick}
                        value={String.fromCharCode(i)}>{String.fromCharCode(i)}</Button>
            )
        }

        result.push(
            <Button type="button" variant='primary' key={'other'} onClick={onAlphabetClick}
                    value='1-9'>0-9</Button>
        )
        return result;
    }

    const elementContainsSearchString = (searchInput, element) => (searchInput ? element.name.toLowerCase().includes(searchInput.toLowerCase()) : false);

    const filterItems = (itemList) => {
        let result = [];
        if (itemList && (alphabet)) {

            result = itemList.filter((element) => (element.name.charAt(0).toLowerCase() === alphabet.toLowerCase()) ||
                elementContainsSearchString( element));
        } else {
            result = itemList || [];
        }

        result = result.map((item) => (<li>{item.name}</li>))
        return result;
    }


    const refresh = () => {
        setDataTable([])
        setAlphabet(alphabet)
        setPageChange(true)
    }

    const itemList = []// const itemList = undefined;
    const filteredList = filterItems(itemList);
    return (
        <div>
            {dbErrAlert && <Alert severity="error">Request failed with status code 404</Alert>}
            <div>{prepareAlphabets()}</div>

            <ul>
                {filteredList}
            </ul>

            <div className={'myclass'}>
                <Table refresh={refresh}  columns={columns} data={dataTable}
                       setSpinnerOn={setSpinnerOn} checkbox={checkbox} alphabet={alphabet}/>
            </div>


        </div>
    );

}

export default PaginationUI;