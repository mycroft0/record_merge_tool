import React, {useEffect, useState} from "react";
import {useTable} from "react-table"
import * as ReactBootStrap from 'react-bootstrap'
import {Alert} from "@mui/lab";
import MergeDialog from "./Modal";


export default function Table({refresh, columns, data, alphabet, setSpinnerOn}) {
    const [userInfo, setUserInfo] = useState([]);
    const [isRecords, setIsRecords] = useState(false);

    useEffect(() => {
        cleanModalData()
    }, [alphabet])


    const handleChange = (e) => {
        // Destructuring
        const {value, checked} = e.target;

        // Case 1 : The user checks the box
        if (checked) {
            userInfo.push(value);

        } else if (!checked) {
            userInfo.pop();
        }
    };

    const cleanModalData = () => {
        setUserInfo([])
        setSpinnerOn()
    }


    useEffect(() => {
        if (userInfo === []) {
            setIsRecords(true)
        }
    }, [userInfo])
    // Use the useTable Hook to send the columns and data to build the table
    const {
        getTableProps, // table props from react-table
        headerGroups, // headerGroups, if your table has groupings
        rows, // rows for the table based on the data passed
        prepareRow // Prepare the row (this function needs to be called for each row before getting the row props)
    } = useTable({
        columns, data
    });


    return (<>
            <div className={'table-container'}>
                {isRecords && <Alert severity="error">Please choose records!</Alert>}
                <MergeDialog setSpinnerOn = {setSpinnerOn} cleanModalData={cleanModalData} json = {data} refresh={refresh} data={userInfo} alphabet={alphabet}
                             />
                <ReactBootStrap.Table className={'main-table'} bordered hover responsive size="sm" {...getTableProps()}>
                    <thead>
                    {headerGroups.map(headerGroup => (<tr {...headerGroup.getHeaderGroupProps()}>
                        <th></th>
                        {headerGroup.headers.map((column, index) => (<th key={index}> {column.render("Header")}</th>))}
                        <th></th>
                    </tr>))}
                    </thead>
                    <tbody>
                    {rows.map((row, i) => {
                        prepareRow(row);
                        return (<tr {...row.getRowProps()}>
                            <td><input key={i}
                                       value={row.cells[3].value}
                                       onChange={handleChange}
                                       type={'checkbox'}/></td>
                            {row.cells.map((cell, index) => {
                                return (<td className={'checkbox-style'} key={index}>{cell.render("Cell")}</td>)
                            })}

                        </tr>);


                    })
                    }

                    </tbody>
                </ReactBootStrap.Table>

            </div>

        </>

    );
}