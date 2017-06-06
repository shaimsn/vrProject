clc;
clear;
%% From JS to MATLAB

%importing data
hrir_data_L = importdata('hrirs_L.txt');
hrir_data_R = importdata('hrirs_R.txt');

%getting 2d array of hrirs recovered from js. each batch of n rows have
%data for a single azimuth, but all the elevations
hrir_2d_L = [zeros(length(hrir_data_L.data),1) hrir_data_L.data];
hrir_2d_R = [zeros(length(hrir_data_R.data),1) hrir_data_R.data];

%converting bank to 3d array representation, matching abstraction used
%on javascript files
num_azimuths = 25;
num_elevations = 50;
hrir_size = 200;

hrir_3d_L = zeros(num_azimuths, num_elevations, hrir_size);
hrir_3d_R = zeros(num_azimuths, num_elevations, hrir_size);

for i = 1:num_azimuths
    for j = 1: num_elevations
        hrir_3d_L(i,j,:) = hrir_2d_L((i-1)*num_elevations+j,:);
        hrir_3d_R(i,j,:) = hrir_2d_R((i-1)*num_elevations+j,:);

    end
end


%% PROCESSING ON MATLAB

%minimum phase
min_hrir_3d_L = hrir_3d_L; %<- to be changed to minPhaseize(hrir_3d_L)
min_hrir_3d_R = hrir_3d_R;

%linear phase
lin_hrir_3d_L = hrir_3d_L; %<- to be changed to linearPhaseize(hrir_3d_L)
lin_hrir_3d_R = hrir_3d_R;


%% FROM MATLAB TO JS

%minimum phase

%converting back to 2d for export
[rows cols] = size(hrir_2d_L);
hrir_2d_processed_L = zeros(rows, cols);
hrir_2d_processed_R = zeros(rows, cols);


for i = 1:num_azimuths
    for j = 1: num_elevations
        hrir_2d_processed_L((i-1)*num_elevations+j,:) = min_hrir_3d_L(i,j,:);
        hrir_2d_processed_R((i-1)*num_elevations+j,:) = min_hrir_3d_R(i,j,:);

    end
end

%exporting processed hrirs to .js to use on javascript
writeJavascriptFile(hrir_2d_processed_L, 'min', 'L'); 
writeJavascriptFile(hrir_2d_processed_R, 'min', 'R');


%linear phase

[rows cols] = size(hrir_2d_L);
hrir_2d_processed_L = zeros(rows, cols);
hrir_2d_processed_R = zeros(rows, cols);


for i = 1:num_azimuths
    for j = 1: num_elevations
        hrir_2d_processed_L((i-1)*num_elevations+j,:) = lin_hrir_3d_L(i,j,:);
        hrir_2d_processed_R((i-1)*num_elevations+j,:) = lin_hrir_3d_R(i,j,:);

    end
end

%exporting processed hrirs to .js to use on javascript
writeJavascriptFile(hrir_2d_processed_L, 'lin', 'L'); 
writeJavascriptFile(hrir_2d_processed_R, 'lin', 'R');
