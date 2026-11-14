import zipfile, re, os
src='/Users/gabrielsalem/Documents/BizOptimizer/deliverables/VDO-X-Human-Behavior-Strategies.pptx'
tmp=src+'.normalized'
with zipfile.ZipFile(src,'r') as zin, zipfile.ZipFile(tmp,'w',zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data=zin.read(item.filename)
        if item.filename=='[Content_Types].xml':
            xml=data.decode('utf-8')
            xml=re.sub(r'<Override PartName="/ppt/slideMasters/slideMaster(?:[2-9]|1[0-9])\.xml"[^>]*/>','',xml)
            data=xml.encode('utf-8')
        zout.writestr(item,data)
os.replace(tmp,src)
