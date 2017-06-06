function writeJavascriptFile(hrir_2d_processed, channel)
 
csvwrite('without_comma_at_end.js',hrir_2d_processed);

fid1 = fopen('without_comma_at_end.js');
fid2 = fopen(['../public/js/lin_phase_hrirs_' channel '.js'],'w');
tline = fgets(fid1);
Character2add = ',';

fprintf(fid2,['var lin_phase_hrirs_' channel ' = [']);

while ischar(tline)
    tline(end) = ',';
    tline = [tline '\n'];
    fprintf(fid2,tline);
    tline = fgets(fid1);
end

fprintf(fid2,']');
fclose(fid1);
fclose(fid2);
delete 'without_comma_at_end.js'

end