---
layout: page
title: Download
permalink: /download/
---
{% assign download_url = site.base_download_url | append: site.version | append: '/' | append: site.prod_filename | append: '_' | append: site.version %}
#### Current version: {{site.version}}
### Windows
Portable 32/64bit: [download]({{download_url | append: '.exe'}})

### Linux
Deb 32bit: [download]({{download_url | append: '_i386.deb'}})

Deb 64bit: [download]({{download_url | append: '_amd64.deb'}})