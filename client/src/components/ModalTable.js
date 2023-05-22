import React, {useState, useRef} from "react";
import {Table, TableHead, TableBody, TableRow} from "@mui/material";

const ModalTable = ({data, idItem, createPostRequest}) => {

    const [isActive, setIsActive] = useState('');
    const ref = useRef(null);

    const handleChange = (e) => {
        ref.current.checked = false
        idItem = e.target.value
        createPostRequest(e.target.value)
        setIsActive(e.target.value)
        ref.current = e.target
    }


    return (
        <>
            <div className="col">
                <Table >
                    <TableHead>
                    <TableRow>
                        <td className={'modal-th'}></td>
                        <td className={'modal-table-th'}>id</td>
                        <td className={'modal-table-th'}>name</td>
                        <td className={'modal-table-th'}>address</td>
                        <td className={'modal-table-th'}>country</td>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {data.map((home, index) =>
                        <TableRow className={'modal-table-container'} key={index}>
                            <td className={'modal-table'}  ><input ref={ref} key = {home.id} type={"checkbox"} defaultChecked = {false} onChange={handleChange} value={home.id}/></td>
                            <td className={'modal-table-data'}>{home.id}</td>
                            <td className={'modal-table-data'}>{home.name}</td>
                            <td className={'modal-table-data'}>{home.address2}</td>
                            <td className={'modal-table-data'}>{home.country_name}</td>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                {isActive && <p>Record with ID: {isActive}</p>}
            </div>
        </>
    )
}

export default ModalTable