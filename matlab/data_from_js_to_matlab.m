clc;
clear;

%importing data
hrir_data = importdata('hrirs.txt');

%getting 2d array of hrirs recovered from js. each batch of n rows have
%data for a single azimuth, but all the elevations
hrir_2d = [zeros(length(hrir_data.data),1) hrir_data.data];

%converting bank to 3d array representation, matching abstraction used
%on javascript files
num_azimuths = 25;
num_elevations = 50;
hrir_size = 200;

hrir_3d = zeros(num_azimuths, num_elevations, hrir_size);

for i = 1:num_azimuths
    for j = 1: num_elevations
        hrir_3d(i,j,:) = hrir_2d((i-1)*num_elevations+j,:);
    end
end

%processing happens here%%%%%%%%
hrir_3d = hrir_3d + 7;
%%%%%%%%%

%converting back to 2d for export
[rows cols] = size(hrir_2d);
hrir_2d_processed = zeros(rows, cols);

for i = 1:num_azimuths
    for j = 1: num_elevations
        hrir_2d_processed((i-1)*num_elevations+j,:) = hrir_3d(i,j,:);
    end
end

%exporting processed hrirs to txt to use on javascript
csvwrite('without_comma_at_end.js',hrir_2d_processed);

fid1 = fopen('without_comma_at_end.js');
fid2 = fopen('../public/js/lin_phase_hrirs.js','w');
tline = fgets(fid1);
Character2add = ',';

fprintf(fid2,'var lin_phase_hrirs = [');

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

% %adding "var lin_phase_hrirs = [" at the beginning
% fid2 = fopen('lin_phase_hrirs.js','r+');
% tline = fgets(fid2);
% fseek(fid2, 0, 'cof');
% Word2add = 'var lin_phase_hrirs = [';
% fprintf(fid2, Word2add);
% fclose(fid2);
%adding closing bracket
% fid2 = fopen('lin_phase_hrirs.js','a');
% fprintf(fid2, ']');
% fclose(fid2);


