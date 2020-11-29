# Rabbit Sky - Client Side (Web Assets)

This is the Client Side / Web Assets / Part One of the Rabbit Sky. This repository contains only HTML, CSS, Javascripts and Images.

Since this part only contains assets, you must run a webserver to serve these assets. We recommend to use NGINX, since it's lightweight and very high performance.

Also, Rabbit Sky cannot run on it's own without the server side of the Rabbit Sky. [Click here to see the Server Side / Part Two](https://github.com/rabbitsky-io/rabbitsky-server).

## Overall Requirement
##### Mandatory
- VM / VPS / Dedicated Server, with minimum 1GB of RAM. Linux OS (Ubuntu / CentOS) is preferred.
- Public IP attached on the VM / VPS / Dedicated Server.
- Web Server such as NGINX, Lighttpd or Apache.
- This Client Assets.
- [RabbitSky Server (Go)](https://github.com/rabbitsky-io/rabbitsky-server).

##### Optional
- Domain / Sub Domain. You can use IP, but having a domain is preferred.
- SSL Certificate. Mandatory if you want to use **Twitch Embed**, see Known Problem below for more detail.

## Download

You can download these repository as zip, or simply clone this git to your webserver folder.

```
git clone git@github.com:rabbitsky-io/rabbitsky-server.git
```

Also you need the Rabbit Sky Server, [Click here to see the Server Side / Part Two](https://github.com/rabbitsky-io/rabbitsky-server).

## Installing

Basically, just download this repo, run the server side, edit the configuration file, run a webserver that point the webroot to the assets folder, and you're good to go!

## Web Server?
This client won't run standalone, it need the helps of webserver to serve the files. We recommend to use NGINX, but there's a lot of other web server like Lighttpd, Apache HTTPD, etc.

If you're interested in using NGINX for your web server, please follow [this tutorial on how to install it](https://docs.nginx.com/nginx/admin-guide/installing-nginx/installing-nginx-open-source/).

Also if you want to have one domain for both the client and server side using nginx, use this example:

```
server {
    listen 80;
    server_name demo.rabbitsky.io;

    # Change this if your folder is different with the default
    root /var/www/rabbitsky-web;

    location /channel/ {
        # this is the default port of the server side
        proxy_pass http://127.0.0.1:8080;
    }

    # Web Socket Upgrade
    location = /channel/join {
        # this is the default port of the server side
        proxy_pass http://127.0.0.1:8080;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## What's Inside?
This client side use fully written in Plain Javascript, [THREE.js](https://threejs.org/), plain CSS, and Plain HTML. We don't want to use any other framework because we want it to have a good performance, even on mobile phone and toaster pc (also our main goal is to have this run on Samsung Smart Fridge!).

Also we used third party script, like WebFont and EmojiPicker. Some third party scripts was edited so it works great on the Rabbit Sky.

## Configuration File

Configuration file is JSON Formatted, located at: `config.json`

You can copy the `config.example.json` to `config.json` and edit it to your own configuration.

#### Configuration Example

```
{
    "embed": {
        "type": "twitch",
        "id": "monstercat",
        "chat": true
    },
    "servers": [
        {
            "name": "Demo Rabbit Sky",
            "host": "demo.rabbitsky.io",
            "secure": true
        }
    ]
}
```

#### Configuration Explanation
| Variable | Type | Description |
| ----- | ---- | ----------- |
| embed.type | string | Type of embed video, acceptable value are only `twitch` for TwitchTV, and `youtube` for YouTube Live.
| embed.id | string | ID of the embed video. For Twitch, you can use the channel name: `twitch.tv/[channelID]`, so the value is the ChannelID. For YouTube Live, you can use the id in the url: `youtube.com/watch?v=[youtubeID]`, so the value is the YouTubeID.
| embed.chat | boolean | Show live chat on the right side of the game. |
| servers | array | Contains array of the server detail. You can have multiple servers without maximum number. |
| servers[].name | string | Name of the server, it shows in Server List menu. |
| servers[].host | string | Domain / Hostname where the server side is running. You can use IP. Ex: `https://demo.rabbitsky.io/` or `wss://demo.rabbitsky.io` so the value is `demo.rabbitsky.io`. **Please remember to set your Server Side origin parameter to this client domain.** |
| servers[].secure | boolean | Server is using SSL Web Server. If you're using https or wss, you should give this value true. If you're using plain http or ws, set it to false. **We recommend you to use HTTPS and WSS due to security and compability. Read Known Problem below.** |

## Anything Easy to Customize?
Yes, for now you easily can change images, emoji and chat filter. If you need more, you have to write some codes. Is it hard? Maybe.

##### Images
You can customize image such as Banner, Logo, and Skybox. Detail:
| Filename | Type | Resolution | Description |
| -------- | ---- | ---------- | ----------- |
| images/og-image.jpg | image/jpeg | 1200 x 627 | For OpenGraph Preview of your website. It works on all social media such as Facebook, Twitter, and Reddit. Cannot be deleted. |
| images/sky/bottom.png | image/png | 1000 x 1000 | Sky Box, Bottom. Should be transparent if you want to change sky color by command. Bigger resolution is better. Cannot be deleted.  |
| images/sky/top.png | image/png |  1000 x 1000 | Sky Box, Top. Should be transparent if you want to change sky color by command. Bigger resolution is better. Cannot be deleted. |
| images/sky/side.png | image/png |  1000 x 1000 | Sky Box, all 4 sides. Should be transparent if you want to change sky color by command. Bigger resolution is better. Cannot be deleted. |
| images/stage/banner-left.png | image/png | 500 x 2560 | Stage Banner Left Side. Can be transparent. **Can be deleted, the object will be gone.** |
| images/stage/banner-right.png | image/png | 500 x 2560 | Stage Banner Right Side. Can be transparent. **Can be deleted, the object will be gone.** |
| images/stage/logo.png | image/png | 9900 x 500 | Stage Logo on the top. Can be transparent. **Can be deleted, the object will be gone.** |
| images/stage/logo-box.png | image/png | 400 x 400 | Spinning box on top of the speaker, for both left and right. Can be transparent. **Can be deleted, the object will be gone.** |

##### Emoji
You can add, remove, and edit Emoji on `extras/emoji.json`. Format is JSON, emoji is on UTF-8 Unicode. You can see the detail from the file.

##### Chat Filter
You can add, remove, and edit Emoji on `extras/chatfilter.txt`. One word per line.

## I want to edit [...], can I do that?

Yes, you can edit whatever you like, then publish it for your own web. Changing name, logo, even if you want to remove the footer, you can do it. We do not want to limit what you want to do in Rabbit Sky. If you can do it, just do it.

## In Game Chat Command
For in-game chat command, please refer to the [Server Side](https://github.com/rabbitsky-io/rabbitsky-server) ReadMe file.

## Gamepad Controller Support
Rabbit Sky is now Gamepad Enabled, **BUT** we marked it as BETA. That means it will not works 100% well, there will be problem, bug, or browser hang, and also it is because Gamepad API is still in draft.

If you found any bug, let us know by raising issues.

## Known Problem That Cannot Be Fixed
- Twitch only allow secure website (HTTPS) to embed their player. There is no other way to do it except you must install SSL Certificate on your web server. You can generate SSL Cert for free using LetsEncrypt, or you can use third-party that can change your server to HTTPS like Cloudflare.
- YouTube Live Chat not logged in for some browsers, eventho you login-and-out, live chat still treat you as guest. We still don't know why, they don't have official documentation on how embed their live chat. If you encounter this problem, please change your browser. Chrome works best for us.

## I am confusion, can you do it for me?
Depends. We can create your own server for some price, but we do not have a big team, so it will take some time. If you're really interested, hit us up. You can see our contact on our website.

## Donate
Liking this and having a spare of money? Consider donating!

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://paypal.me/wibisaja)

## Contributing

Yes
