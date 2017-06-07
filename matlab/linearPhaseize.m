function [output_in_3d] = linearPhaseize(input_in_3d)
[rows cols depth] = size(input_in_3d);

for i = 1:rows
    for j = 1:cols
        curr_hrir = squeeze(input_in_3d(i,j,:));
        curr_linphase_hrir = convert2linPhaseImp(curr_hrir);
        output_in_3d(i,j,:) = curr_linphase_hrir;
    end
end



end