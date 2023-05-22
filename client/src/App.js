import React, {useState} from "react";
import PaginationUI from "./components/Pagination";
import Header from "./components/Header";
import {SyncLoader} from "react-spinners";


function App() {

    const [spinnerLoad, setSpinnerLoad] = useState(false)

    const setSpinner = () => {

        /*
        * setTimeout(()=>{
            setSpinnerLoad(false)
        },0)
        * */

    }

    const setSpinnerOn = () =>{
        /* setSpinnerLoad(true)*/

    }



    return (
        <div >
            <div className={'table-info'}>
                <Header/>
                <PaginationUI setSpinnerOn = {setSpinnerOn} setSpinner = {setSpinner}/>
            </div>
            {spinnerLoad && <div className={'blur-wall'}></div>}
            {
                spinnerLoad && <div className={'main-container'}>
                    <SyncLoader margin = '12px' color="#336DD7" size = '30px'/>
                </div>
            }


        </div>);
}

export default App;

