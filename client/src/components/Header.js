import {AppBar, Toolbar, IconButton, Typography} from "@mui/material"
import React from 'react';

export default function Header() {
    return (
        <AppBar position="static">
            <Toolbar variant="dense">
                <IconButton edge="start" color="inherit" aria-label="menu" sx={{mr: 2}}>
                    <Typography variant="h6" color="inherit" component="div">
                        Merge Records
                    </Typography>
                </IconButton>

            </Toolbar>
        </AppBar>
    )
}