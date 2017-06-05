clc;
clear;

%importing data
hrir_data = importdata('hrirs.txt');

%getting 2d array of hrirs recovered from js. each batch of n rows have
%data for a single azimuth, but all the elevations
hrir_2d = hrir_data.data;

%converting bank to 3d array representation, matching abstraction used
%on javascript files
num_azimuths = 25;
num_elevations = 50;
hrir_size = 200;

hrir_3d = zeros(num_azimuths, num_elevations, hrir_size-1);

for i = 1:num_azimuths
    for j = 1: num_elevations
        hrir_3d(i,j,:) = hrir_2d((i-1)*num_elevations+j,:);
    end
end