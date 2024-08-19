import React from "react";

export default function InfoList({children, title} : {children?: React.ReactNode, title: string}) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            columnGap: 10,
            width: '80%',
            height: '80%',
            position: 'absolute',
            borderRadius: 10,
            boxShadow: '1px 1px black',
            backgroundColor: 'crimson',
            overflowY: "scroll",
        }}>
            <h2 style={{textAlign: "center"}}>{title}</h2>
            {children}
        </div>
    )
}


export function InfoItem({demo, description}: {demo: React.ReactNode; description: React.ReactNode}) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            padding: 10,
            rowGap: 10
        }}>
            <div style={{
                width: '30%',
                height: '100%',
                border: "1px solid black",
                borderRadius: 10,
                padding: 10,
                position: 'relative',
                backgroundColor: 'pink'
            }}>
                {demo}
            </div>
            <div style={{
                width: '70%',
                height: '100%',
                border: "1px solid black",
                borderRadius: 10,
                padding: 10,
                position: 'relative',
                backgroundColor: 'pink'
            }}>
                {description}
            </div>
            
        </div>
    )
}