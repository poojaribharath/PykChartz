#! /bin/bash

#path variable
js_src_path='src/js';

#variable hold list of files (that may or may not be in js_src_path)
files="$js_src_path/*.js";

for file in $files
do
    echo "Processing $file";
    sed -i 's/console\.log(.*)[;]*//g' $file;
done
