import {
    BoxBufferGeometry,
    MeshStandardMaterial,
    Mesh
} from '../three.module.js';

import { BufferGeometryUtils } from "./BuffersGeometryUtils.js";

var Speaker = function() {
    var speakerGeo = [];

    var speakerGeoMain = new BoxBufferGeometry( 250, 100, 200 );

    var speakerGeoBorder1 = new BoxBufferGeometry( 250, 10, 10 );
    var speakerGeoBorder2 = speakerGeoBorder1.clone();
    speakerGeoBorder1.translate( 0, 45, 105 );
    speakerGeoBorder2.translate( 0, -45, 105 );

    var speakerGeoBorder3 = new BoxBufferGeometry( 10, 100, 10 );
    var speakerGeoBorder4 = speakerGeoBorder3.clone();
    speakerGeoBorder3.translate( 120, 0, 105 );
    speakerGeoBorder4.translate( -120, 0, 105 );

    speakerGeo.push(speakerGeoMain);
    speakerGeo.push(speakerGeoBorder1);
    speakerGeo.push(speakerGeoBorder2);
    speakerGeo.push(speakerGeoBorder3);
    speakerGeo.push(speakerGeoBorder4);

    var speakerColor = new MeshStandardMaterial( {
        emissive: 0x0,
        color: 0x141414,
        roughness: 0.1,
        metalness: 0
    });

    var speakerBuffer = BufferGeometryUtils.mergeBufferGeometries(speakerGeo);

    var speakerAll = [];

    for(var i = 0; i < 7; i++) {
        var speaker = speakerBuffer.clone();

        if( i == 6 ) {
            speaker.scale(1, 2, 1.5);
            speaker.translate(0, (i * -102) - 51, -55);
        } else {
            speaker.translate(0, (i * -102), 0);
        }

        speakerAll.push(speaker);
    }

    var speakerAllBuffer = BufferGeometryUtils.mergeBufferGeometries(speakerAll);

    var speaker = new Mesh( speakerAllBuffer, speakerColor );

    var speakerLineGeo = [];
    var speakerGeoLine = new BoxBufferGeometry( 248, 1, 1 );
    speakerGeoLine.translate(0, 48, 105);
    speakerLineGeo.push(speakerGeoLine);

    for(var i = 1; i < 24; i++) {
        var speakerGeoLineTemp = speakerGeoLine.clone();
        speakerGeoLineTemp.translate(0, (i * -4), 0);
        speakerLineGeo.push(speakerGeoLineTemp);
    }

    var speakerGeoLineH = new BoxBufferGeometry( 1, 98, 1 );
    speakerGeoLineH.translate(123, 0, 105);
    speakerLineGeo.push(speakerGeoLine);

    for(var i = 1; i < 60; i++) {
        var speakerGeoLineTemp = speakerGeoLineH.clone();
        speakerGeoLineTemp.translate((i * -4), 0, 0);
        speakerLineGeo.push(speakerGeoLineTemp);
    }

    var speakerLineColor = new MeshStandardMaterial( {
        emissive: 0x1c1c1c,
        color: 0x292929,
        roughness: 0.3,
        metalness: 0
    });

    var speakerLineBuffer = BufferGeometryUtils.mergeBufferGeometries(speakerLineGeo);

    var speakerLineAll = [];

    for(var i = 0; i < 8; i++) {
        var speakerLine = speakerLineBuffer.clone();

        if( i == 7 ) {
            speakerLine.translate(0, (i * -102) + 10, 0);
        } else {
            speakerLine.translate(0, (i * -102), 0);
        }

        speakerLineAll.push(speakerLine);
    }

    var speakerLineAllBuffer = BufferGeometryUtils.mergeBufferGeometries(speakerLineAll);

    var speakerLine = new Mesh( speakerLineAllBuffer, speakerLineColor );

    speaker.add(speakerLine);

    return speaker

}

export { Speaker }